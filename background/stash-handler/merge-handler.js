const MergeHandler = ({
  stash,
  jenkins,
  branchToJobMap,
  unmergedList,
  notifier,
  jira,
  config,
  ticketUpdater,
  observable,
  JIRA_STATUSES }) => {
  const notifyAboutMergedPr = ({ key, url, statusName }) => {
    notifier.jiraTicketUpdated({
      ticketId: key,
      ticketUrl: url,
      ticketStatus: statusName
    });
  };

  const getJobName = branchName => branchToJobMap[branchName];
  const handle = () => {
    return stash.startPoolingForMerged({
      poolInterval: Number(config.stash_pool_interval)
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
            .waitForNextDeploy(jobName, Number(config.jenkins_pool_interval))
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
