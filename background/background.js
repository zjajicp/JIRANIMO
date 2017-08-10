(function main() {
  const startScanning = (config) => {
    const ajax = Ajax({
      observable: Rx.Observable
    });

    const jira = Jira({
      ajax,
      basicAuthentication: getBasicAuthentication,
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
      notifications: chrome.notifications,
      observable: Rx.Observable
    });

    const notifyAboutMergedPr = ({ key, url, statusName }) => {
      notifier.jiraTicketUpdated({
        ticketId: key,
        ticketUrl: url,
        ticketStatus: statusName
      });
    };

    const updateRelatedJiraTickets = (prData, { statusPath, assignToReporter }) => {
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
            statusPath: statusPath.map(status => status.code),
            assigneeName: assignToReporter && assigneeName
          };
          return jira.updateTransitionWithPath(key, data).map(() => ({
            key,
            url,
            statusName: statusPath[statusPath.length - 1].name,
            prId: prData.id,
            prTitle: prData.title
          }));
        });
    };

    const unsubscribeFromObservingPrCreation = Rx.Observable.of({
      title: ' Bugfix (RW-25005): Removed action duplication'
    })
      .delay(5000)
      .mergeMap(prBasicData => stash.getPoolRequest(prBasicData, 'OPEN'))
      .mergeMap(prData => updateRelatedJiraTickets(prData, {
        statusPath: [
          JIRA_STATUSES.START_PROGRESS,
          JIRA_STATUSES.CODE_REVIEW]
      }))
      .mergeMap(({ prId, prTitle, url }) => notifier.prBeingMonitored({
        prId,
        prTitle,
        ticketUrl: url
      }))
      .subscribe({
        next: console.log,
        error: console.error
      });

    const unsubscribeFromWatchingPrMerged = stash.startPoolingForMerged({
      poolInterval: Number(config.stash_pool_interval)
    }).switchMap(mergedPr => updateRelatedJiraTickets(mergedPr, {
      statusPath: [
        JIRA_STATUSES.START_PROGRESS,
        JIRA_STATUSES.CODE_REVIEW,
        JIRA_STATUSES.MOVE_TO_TEST
      ],
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
