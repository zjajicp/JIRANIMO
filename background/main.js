(function main() {
  const startScanning = (config) => {
    // chrome.storage.local.set({
    //   unmerged: [{
    //     title: 'Bugfix (RW-25658): Fixed price breakdown resize blinking issue',
    //     description: '',
    //     buildNumber: 3128
    //   }]
    // });
    // INITING DEPS START
    const ajax = Ajax({
      observable: Rx.Observable
    });

    const jenkins = Jenkins({
      ajax,
      observable: Rx.Observable,
      basicAuthentication: Utils.getBasicAuthentication,
      config: {
        username: config.jenkins.username,
        password: config.jenkins.password,
        baseUrl: config.jenkins.baseUrl
      }
    });

    const jira = Jira({
      ajax,
      basicAuthentication: Utils.getBasicAuthentication,
      observable: Rx.Observable,
      config: {
        username: config.jira.username,
        password: config.jira.password,
        apiUrl: config.jira.restApiUrl
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
        username: config.stash.username,
        password: config.stash.password,
        authorToWatch: config.stash.authorToWatch,
        baseUrl: config.stash.baseUrl,
        restApiPath: config.stash.restApiPath,
        restJiraPath: config.stash.restJiraPath,
        project: config.stash.project,
        repository: config.stash.repository
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
      stashPoolInterval: config.stash.poolInterval,
      jenkinsPoolInterval: config.jenkins.poolInterval,
      branchToJobMap: config.jenkins.branchToJobMapper,
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
        cleanupScanning = startScanning(config);
      });
  }
}());
