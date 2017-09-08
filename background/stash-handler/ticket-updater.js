const TicketUpdater = ({
  jira,
  stash
}) => {
  const updateRelatedJiraTickets = (prData, { statusPaths, assignToReporter }) => {
    return stash
      .getRelatedJiraKeys(prData.id)
      .mergeMap(({ key, url }) => jira.getTicket(key)
        .map(({ data }) => ({
          key,
          url,
          assigneeName: data.fields.creator.name // assign ticket to the reporter
        }))
      )
      .mergeMap(({ key, url, assigneeName }) => {
        const data = {
          statusPaths: statusPaths.map(path => path.map(status => status.code)),
          assigneeName: assignToReporter && assigneeName
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
