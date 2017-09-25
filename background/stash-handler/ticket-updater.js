const TicketUpdater = ({
  jira,
  stash,
  workflowPaths,
  ISSUE_TYPES
}) => {
  const updateRelatedJiraTickets = (prData = {}, {
    statusPathType = '',
    assignToReporter = '' }) => {
    return stash
      .getRelatedJiraKeys(prData.id)
      .mergeMap(({ key, url }) => jira.getTicket(key)
        .map(({ data }) => ({
          key,
          url,
          assigneeName: data.fields.creator.name, // assign ticket to the reporter
          issueType: {
            id: data.fields.issuetype.id,
            name: data.fields.issuetype.name
          }
        }))
      )
      .mergeMap(({ key, url, assigneeName, issueType }) => {
        const statusPaths = workflowPaths.get(statusPathType, issueType.id);
        const resolutionDoneId = '10000';
        const data = {
          statusPaths: statusPaths.map(path => path.map(status => status.code)),
          assigneeName: assignToReporter && assigneeName,
          resolution: issueType.id === ISSUE_TYPES.SUB_TASK.ID &&
            statusPathType === workflowPaths.STATUS_PATH_TYPES === statusPathType &&
            resolutionDoneId
        };

        return jira.updateTransitionWithManyPaths(key, data).map(() => ({
          key,
          url,
          statusName: statusPaths[0][statusPaths[0].length - 1].name,
          prId: prData.id,
          prTitle: prData.title
        }));
      });
  };

  return {
    updateRelatedJiraTickets
  };
};
