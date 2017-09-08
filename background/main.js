(function main() {
  const startScanning = (config, branchToJobMap) => {

    // INITING DEPS START
    const ajax = Ajax({
      observable: Rx.Observable
    });

    const jenkins = Jenkins({
      ajax,
      observable: Rx.Observable,
      basicAuthentication: Utils.getBasicAuthentication,
      config: {
        username: config.jenkins_username,
        password: config.jenkins_password,
        baseUrl: config.jenkins_base_url
      }
    });

    const jira = Jira({
      ajax,
      basicAuthentication: Utils.getBasicAuthentication,
      observable: Rx.Observable,
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
      getBasicAuthentication: Utils.getBasicAuthentication,
      getPrEqualsFn: Utils.getPrEqualsFn,
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
      notifications: chrome.notifications,
      observable: Rx.Observable
    });

    const unmergedList = UnmergedList({
      localStorage: chrome.storage.local,
      getPrEqualsFn: Utils.getPrEqualsFn
    });

    const ticketUpdater = TicketUpdater({
      jira,
      stash
    });

    const mergeHandler = MergeHandler({
      jira,
      stash,
      config,
      branchToJobMap,
      unmergedList,
      jenkins,
      notifier,
      ticketUpdater,
      observable: Rx.Observable,
      JIRA_STATUSES
    });

    const poolRequestHandler = PoolRequestHandler({
      jenkins,
      stash,
      ticketUpdater,
      notifier,
      unmergedList,
      JIRA_STATUSES
    });

    // INITING DEPS END

    const unsubscribeFromObservingPrCreation = poolRequestHandler.handle()
      .subscribe({
        next: console.log,
        error: console.error
      });

    const unsubscribeFromWatchingPrMerged = mergeHandler.handle()
      .subscribe({
        next: console.log,
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
      .subscribe((config = {}) => {
        cleanupScanning();
        cleanupScanning = startScanning(config.inputs, config.branchToJobMap);
      });
  }
}());
