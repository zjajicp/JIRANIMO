const MergeHandler = ({
  stash,
  jenkins,
  branchToJobMap,
  unmergedList,
  notifier,
  jira,
  stashPoolInterval,
  jenkinsPoolInterval,
  ticketUpdater,
  observable,
  JIRA_STATUSES }) => {
  const notifyAboutMergedPr = ({ key, url, statusName }) => {
    console.log('Notifiying merged PR', key, url);
    notifier.jiraTicketUpdated({
      ticketId: key,
      ticketUrl: url,
      ticketStatus: statusName
    });
  };

  const getJobName = branchName => branchToJobMap[branchName];
  const handle = () => {
    return stash.startPoolingForMerged({
      poolInterval: stashPoolInterval
    })
      .filter(mergedPr => unmergedList.find(mergedPr))
      .map(mergedPr => Object.assign({}, mergedPr, unmergedList.find(mergedPr)))
      .do(unmergedList.remove) // remove just from memory
      .mergeMap((mergedPr) => {
        const jobName = getJobName(mergedPr.toRef.displayId);
        return jenkins.getCurrentBuildNumber(jobName).switchMap((currentBuildNumber) => {
          if (currentBuildNumber > mergedPr.buildNumber) {
            return observable.of(mergedPr);
          }

          return jenkins
            .waitForNextDeploy(jobName, jenkinsPoolInterval)
            .map(() => mergedPr);
        });
      })
      .do((mergedPr) => {
        // remove from local storage
        unmergedList.remove(mergedPr, true);
      })
      .mergeMap(mergedPr => ticketUpdater.updateRelatedJiraTickets(mergedPr, {
        statusPaths: [[
          JIRA_STATUSES.START_PROGRESS_FROM_OPEN,
          JIRA_STATUSES.CODE_REVIEW,
          JIRA_STATUSES.MOVE_TO_TEST
        ], [
          JIRA_STATUSES.START_PROGRESS_FROM_REOPEN,
          JIRA_STATUSES.CODE_REVIEW,
          JIRA_STATUSES.MOVE_TO_TEST
        ], [
          JIRA_STATUSES.CODE_REVIEW_FROM_BLOCKED,
          JIRA_STATUSES.MOVE_TO_TEST
        ], [
          JIRA_STATUSES.MERGE_TO_DEV,
          JIRA_STATUSES.READY_FOR_TEST_FROM_MERGE_TO_DEV
        ]],
        assignToReporter: true
      }))
      .mergeMap(notifyAboutMergedPr)
      .retryWhen(errors => errors.switchMap((error) => {
        if (jira.isInvalidStatusTransition(error)) {
          return observable.of(null);
        }

        return observable.throw(error);
      }));
  };

  return {
    handle
  };
};
