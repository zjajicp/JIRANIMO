const PoolRequestHandler = ({
  jenkins,
  stash,
  ticketUpdater,
  unmergedList,
  notifier,
  JIRA_STATUSES
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
      statusPaths: [[
        JIRA_STATUSES.START_PROGRESS_FROM_OPEN,
        JIRA_STATUSES.CODE_REVIEW,
      ], [
        JIRA_STATUSES.START_PROGRESS_FROM_REOPEN,
        JIRA_STATUSES.CODE_REVIEW
      ], [
        JIRA_STATUSES.CODE_REVIEW_FROM_BLOCKED
      ]]
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
