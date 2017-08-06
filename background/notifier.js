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

  return {
    jiraTicketUpdated
  };
};
