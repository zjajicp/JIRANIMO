const PoolRequestHandler = ({
  jenkins,
  stash,
  ticketUpdater,
  unmergedList,
  notifier,
  workflowPaths,
  branchToJobMap
}) => {
  const extendWithCurrentBuildNumber = (prData) => {
    const jobName = branchToJobMap[prData.toRef.displayId];
    return jenkins
      .getCurrentBuildNumber(jobName)
      .map(currentBuildNumber => Object.assign({
        buildNumber: currentBuildNumber
      }, prData));
  };

  const handle = () => stash.startObservingPrCreation()
    .mergeMap(prBasicData => stash.getPoolRequest(prBasicData, 'OPEN'))
    .mergeMap(extendWithCurrentBuildNumber)
    .do(unmergedList.add)
    .do((prData) => {
      console.log('PR created. PR data extended with jenkins build number', prData);
    })
    .mergeMap(prData => ticketUpdater.updateRelatedJiraTickets(prData, {
      statusPathType: workflowPaths.STATUS_PATH_TYPES.OPEN_PR
    }))
    .do((data) => {
      console.log('JIRA ticket sent to code review status: ', data);
    })
    .mergeMap(({ prId, prTitle, url }) => notifier.prBeingMonitored({
      prId,
      prTitle,
      ticketUrl: url
    }));

  return {
    handle
  };
};
