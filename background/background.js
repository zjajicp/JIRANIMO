(function main() {
  const startScanning = (config) => {
    const ajax = Ajax({
      observable: Rx.Observable
    });

    const jira = Jira({
      ajax,
      basicAuthentication: getBasicAuthentication,
      config: {
        username: config.jira_username,
        password: config.jira_password,
        apiUrl: config.jira_api_url
      }
    });

    const stash = Stash({
      observable: Rx.Observable,
      ajax,
      localStorage: chrome.storage.local,
      webRequest: chrome.webRequest,
      getBasicAuthentication,
      config: {
        username: config.stash_username,
        password: config.stash_password,
        authorToWatch: config.stash_author_to_watch,
        baseUrl: config.stash_base_url,
        restApiPath: config.stash_rest_api_path,
        restJiraPath: config.stash_rest_jira_path,
        project: config.stash_project,
        repository: config.stash_repository
      }
    });

    const notifier = Notifier({
      notifications: chrome.notifications
    });

    const notifyAboutMergedPr = ({ key, url, statusName }) => {
      notifier.jiraTicketUpdated({
        ticketId: key,
        ticketUrl: url,
        ticketStatus: statusName
      });
    };

    const updateRelatedJiraTickets = (mergedPr, { status, assignToReporter }) => {
      return stash
        .getRelatedJiraKeys(mergedPr.id)
        .mergeMap(({ key, url }) => jira.getTicket(key)
          .map(({ data }) => ({
            key,
            url,
            assigneeName: data.fields.creator.name // assign ticket to the reporter
          }))
        )
        .mergeMap(({ key, url, assigneeName }) => {
          const data = {
            status: status.code,
            assigneeName: assignToReporter && assigneeName
          };
          return jira.updateTransition(key, data).map(() => ({
            key,
            url,
            statusName: status.name
          }));
        });
    };

    const unsubscribeFromObservingPrCreation = stash.startObservingPrCreation()
      .mergeMap(prBasicData => stash.getPoolRequest(prBasicData, 'OPEN'))
      .mergeMap(prData => updateRelatedJiraTickets(prData, {
        status: JIRA_STATUSES.CODE_REVIEW
      }))
      .subscribe({
        next: console.log,
        error: console.error
      });

    const unsubscribeFromWatchingPrMerged = stash.startPoolingForMerged({
      poolInterval: Number(config.stash_pool_interval)
    }).mergeMap(mergedPr => updateRelatedJiraTickets(mergedPr, {
      status: JIRA_STATUSES.MOVE_TO_TEST,
      assignToReporter: true
    }))
      .subscribe({
        next: notifyAboutMergedPr,
        error: console.error
      });

    return function cleanup() {
      unsubscribeFromObservingPrCreation.unsubscribe();
      unsubscribeFromWatchingPrMerged.unsubscribe();
    };
  };

  {
    let cleanupScanning = () => { };
    ConfigLoader({
      storage: chrome.storage,
      observable: Rx.Observable
    })
      .load('config')
      .subscribe((config) => {
        cleanupScanning();
        cleanupScanning = startScanning(config);
      });
  }
}());
