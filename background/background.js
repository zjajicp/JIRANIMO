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

    const notifyMainPageAboutMergedPr = ({ key, url, status }) => {
      notifier.jiraTicketUpdated({
        ticketId: key,
        ticketUrl: url,
        status
      });
    };

    const onPrMerged = (mergedPr) => {
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
          return jira.updateTransition(key, {
            status: JIRA_STATUSES.MOVE_TO_TEST,
            assigneeName
          }).map(() => ({
            key,
            url,
            status: JIRA_STATUSES.MOVE_TO_TEST
          }));
        });
    };

    const unsubscribeFromObservingPrCreation = stash.startObservingPrCreation('projects/RA/repos/app.ryanair.com/pull-requests?create')
      .subscribe({
        next: console.log,
        error: console.error
      });

    const unsubscribeFromWatchingPrMerged = stash.startPoolingForMerged({
      poolInterval: Number(config.stash_pool_interval)
    }).mergeMap(onPrMerged)
      .subscribe({
        next: notifyMainPageAboutMergedPr,
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
