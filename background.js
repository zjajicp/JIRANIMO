const ajax = Ajax({
  observable: Rx.Observable
});

const jira = Jira({
  ajax,
  basicAuthentication: getBasicAuthentication,
  config: {
    username: 'zjajicp',
    password: 'Meeting555',
    apiUrl: 'https://jira.ryanair.com:8443/rest/api/2'
  }
});

const stash = Stash({
  observable: Rx.Observable,
  ajax,
  localStorage: chrome.storage.local,
  webRequest: chrome.webRequest,
  getBasicAuthentication,
  config: {
    username: 'zjajic',
    password: 'Meeting555',
    baseUrl: 'https://stash.ryanair.com:8443',
    restApiPath: 'rest/api/latest/projects/RA/repos/app.ryanair.com',
    jiraRestApiPath: 'rest/jira/latest/projects/RA/repos/app.ryanair.com'
  }
});

const handleCreatedPr = console.log;

const notifyMainPageAboutMergedPr = (data) => {
  console.log(data);
};

const onPrMerged = (mergedPr) => {
  console.log(mergedPr);
  stash
    .getRelatedJiraKeys(mergedPr.id)
    .mergeMap(({ key, url }) => jira.getTicket(key).map(ticket => ({
      key,
      url,
      assigneeName: ticket.fields.creator.name // assign ticket to the reporter
    }))
    )
    .mergeMap(({ key, assigneeName }) => jira.updateTransition(key, {
      status: JIRA_STATUSES.MOVE_TO_TEST,
      assigneeName
    }))
    .subscribe({
      next: notifyMainPageAboutMergedPr,
      error: console.error
    });
};

stash.startObservingPrCreation('projects/RA/repos/app.ryanair.com/pull-requests?create')
  .subscribe({
    next: handleCreatedPr,
    error: console.error
  });

stash.startPoolingForMerged({
  mergedPrsPath: 'pull-requests?state=MERGED',
  poolInterval: 1000
}).subscribe({
  next: onPrMerged,
  error: console.error
});
