(function main() {
  const startScanning = (config) => {
    const ajax = Ajax({
      observable: Rx.Observable
    });

    const jenkins = Jenkins({
      ajax,
      observable: Rx.Observable,
      basicAuthentication: getBasicAuthentication,
      config: {
        username: config.jenkins_username,
        password: config.jenkins_password,
        baseUrl: config.jenkins_base_url
      }
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

    const getJobName = mergedPr => config.branchToJobMap[mergedPr.destBranch];

    const unsubscribeFromObservingPrCreation = stash.startObservingPrCreation()
      .delay(10000)
      .mergeMap(prBasicData => stash.getPoolRequest(prBasicData, 'OPEN'))
      .mergeMap(prData => updateRelatedJiraTickets(prData, {
        statusPaths: [[
          JIRA_STATUSES.START_PROGRESS_FROM_OPEN,
          JIRA_STATUSES.CODE_REVIEW,
        ], [
          JIRA_STATUSES.START_PROGRESS_FROM_REOPEN,
          JIRA_STATUSES.CODE_REVIEW
        ], [
          JIRA_STATUSES.CODE_REVIEW_FROM_BLOCKED
        ]]
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
    })
      .mergeMap((mergedPr) => {
        const jobName = getJobName(mergedPr);
        return jenkins.waitForNextDeploy(jobName, Number(config.jenkins_pool_interval))
          .map(() => mergedPr);
      })
      .do((mergedPr) => {
        stash.removeFromUnmergedList(mergedPr);
      })
      .mergeMap(mergedPr => updateRelatedJiraTickets(mergedPr, {
        statusPaths: [[
          JIRA_STATUSES.START_PROGRESS_FROM_OPEN,
          JIRA_STATUSES.CODE_REVIEW,
          JIRA_STATUSES.MOVE_TO_TEST
        ], [
          JIRA_STATUSES.START_PROGRESS_FROM_REOPEN,
          JIRA_STATUSES.CODE_REVIEW,
          JIRA_STATUSES.MOVE_TO_TEST
        ], [
          JIRA_STATUSES.CODE_REVIEW_FROM_BLOCKED,
          JIRA_STATUSES.MOVE_TO_TEST
        ]],
        assignToReporter: true
      }))
      .mergeMap(notifyAboutMergedPr)
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
      .subscribe((config) => {
        cleanupScanning();
        cleanupScanning = startScanning(config);
      });
  }
}());
