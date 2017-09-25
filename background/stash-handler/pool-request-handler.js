const PoolRequestHandler = ({
  jenkins,
  stash,
  ticketUpdater,
  unmergedList,
  notifier,
  workflowPaths
}) => {
  const extendWithCurrentBuildNumber = prData => jenkins.getCurrentBuildNumber()
    .map(currentBuildNumber => Object.assign({
      buildNumber: currentBuildNumber
    }, prData));

  const handle = () => stash.startObservingPrCreation()
    .delay(10000)
    .mergeMap(prBasicData => stash.getPoolRequest(prBasicData, 'OPEN'))
    .map(extendWithCurrentBuildNumber)
    .do(unmergedList.add)
    .mergeMap(prData => ticketUpdater.updateRelatedJiraTickets(prData, {
      statusPathType: workflowPaths.STATUS_PATH_TYPES.MERGED_PR
    }))
    .mergeMap(({ prId, prTitle, url }) => notifier.prBeingMonitored({
      prId,
      prTitle,
      ticketUrl: url
    }));

  return {
    handle
  };
};
