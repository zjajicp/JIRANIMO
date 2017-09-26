(function main() {
  const startScanning = (config) => {
    // INITING DEPS START
    const ajax = Ajax({
      observable: Rx.Observable
    });

    const jiraStatuses = JiraStatuses({
      ISSUE_TYPES
    });

    const workflowPaths = WorkflowPaths({
      ISSUE_TYPES,
      JIRA_STATUSES: jiraStatuses
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
      stash,
      workflowPaths,
      ISSUE_TYPES
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
      workflowPaths
    });

    const poolRequestHandler = PoolRequestHandler({
      jenkins,
      stash,
      ticketUpdater,
      notifier,
      unmergedList,
      workflowPaths,
      branchToJobMap: config.jenkins.branchToJobMapper
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
