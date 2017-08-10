const Notifier = ({
  notifications
}) => {
  const jiraTicketUpdated = ({ ticketId, ticketUrl, ticketStatus }) => {
    const notificationId = ticketId + ticketUrl;
    notifications.create(notificationId, {
      iconUrl: 'icon.png',
      type: 'basic',
      title: 'JIRA ticket updated',
      message: `${ticketId} updated and moved to ${ticketStatus}`
    });

    return notificationId;
  };

  const prBeingMonitored = ({ prTitle, prId }) => {
    const id = prTitle + prId;
    notifications.create(id, {
      iconUrl: 'icon.png',
      type: 'basic',
      title: 'Pool request created',
      message: `Pool request (#${prId} ${prTitle}) is now being monitored`
    });
    return id;
  };

  return {
    jiraTicketUpdated,
    prBeingMonitored
  };
};
