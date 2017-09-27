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
  workflowPaths }) => {
  const notifyAboutMergedPr = ({ key, url, statusName }) => {
    console.log('Notifiying merged PR', key, url);
    return notifier.jiraTicketUpdated({
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
        return jenkins
          .getCurrentBuildNumber(jobName)
          .switchMap((currentBuildNumber) => {
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
        statusPathType: workflowPaths.STATUS_PATH_TYPES.MERGED_PR,
        assignToReporter: true,
      }))
      .do((data) => {
        console.log('Ticket status updated after succesfful deploy: ', data);
      })
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
