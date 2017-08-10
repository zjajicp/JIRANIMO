const Notifier = ({
  notifications,
  observable
}) => {
  const onNotificationButtonClicked = observable.create((observer) => {
    const onClick = (notificationId, buttonIndex) => {
      observer.next({
        notificationId,
        buttonIndex
      });
    };
    chrome.notifications.onButtonClicked.addListener(onClick);
    return () => {
      chrome.notifications.onButtonClicked.removeListener(onClick);
    };
  });

  const getOpenTicketHandler = (id, ticketUrl) => {
    return ({ notificationId }) => {
      if (id === notificationId) {
        chrome.tabs.create({
          url: ticketUrl
        });
      }
    };
  };

  const jiraTicketUpdated = ({ ticketId, ticketUrl, ticketStatus }) => {
    const notificationId = ticketId + ticketUrl;
    notifications.create(notificationId, {
      iconUrl: 'icon.png',
      type: 'basic',
      title: 'JIRA ticket updated',
      message: `${ticketId} updated and moved to ${ticketStatus}`,
      buttons: [{
        title: 'Open ticket'
      }]
    });
    return onNotificationButtonClicked.do(getOpenTicketHandler(notificationId, ticketUrl));
  };

  const prBeingMonitored = ({ prTitle, prId, ticketUrl }) => {
    const notificationId = prTitle + prId;
    notifications.create(notificationId, {
      iconUrl: 'icon.png',
      type: 'basic',
      title: 'Pool request created',
      message: `Pool request (#${prId} ${prTitle}) is now being monitored`,
      buttons: [{
        title: 'Open ticket'
      }]
    });

    return onNotificationButtonClicked.do(getOpenTicketHandler(notificationId, ticketUrl));
  };

  return {
    jiraTicketUpdated,
    prBeingMonitored
  };
};
