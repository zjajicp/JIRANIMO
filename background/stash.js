const Stash = function ({
  config,
  observable,
  getBasicAuthentication,
  ajax,
  localStorage,
  webRequest }) {
  const REST_API_URL = `${config.baseUrl}/${config.restApiPath}/projects/${config.project}/repos/${config.repository}`;
  const REST_JIRA_URL = `${config.baseUrl}/${config.restJiraPath}/projects/${config.project}/repos/${config.repository}`;

  let unmergedPrs = [];

  localStorage.get('unmerged', ({ unmerged }) => {
    unmergedPrs = unmerged || [];
  });

  const saveToLocalStorage = (unmergedList) => {
    localStorage.set({
      name: 'unmerged',
      value: JSON.stringify(unmergedList),
    });
  };

  const addToUnmergedList = ({ title, description }) => {
    unmergedPrs.push({
      title,
      description
    });
    saveToLocalStorage(unmergedPrs);
  };

  const getEquals = object =>
    ({ title, description }) => object.title === title && description === object.description;

  const removeFromUnmergedList = (pr) => {
    const index = unmergedPrs.findIndex(getEquals(pr));
    unmergedPrs.splice(index, 1);
    saveToLocalStorage(unmergedPrs);
  };


  const startObservingPrCreation = () => {
    const filteredUrls = [`${config.baseUrl}/projects/${config.project}/repos/${config.repository}/pull-requests?create`];
    return observable.create((observer) => {
      let poolRequest;
      const onBeforeRequest = (details) => {
        if (details.method === 'POST') {
          poolRequest = Object.assign({}, details.requestBody.formData);
        }

        return details;
      };

      webRequest.onBeforeRequest.addListener(onBeforeRequest, {
        urls: filteredUrls
      }, ['requestBody']);

      const onResponseStarted = (details) => {
        if (details.status < 300 && details.status >= 200) {
          addToUnmergedList(poolRequest);
          observer.next(poolRequest);
        }
      };

      webRequest.onResponseStarted.addListener(onResponseStarted, {
        urls: filteredUrls
      });

      return function unsubscribe() {
        webRequest.onBeforeRequest.removeListener(onBeforeRequest);
        webRequest.onResponseStarted.removeListener(onResponseStarted);
      };
    });
  };

  const ajaxGet = (url, params) => ajax.get(url, params, {
    Authentication: getBasicAuthentication(config.username, config.password)
  });

  const startPoolingForMerged = ({ poolInterval = 3600000, }) => observable
    .interval(poolInterval)
    .mergeMap(() => ajaxGet(`${REST_API_URL}/pull-requests`, {
      state: 'MERGED',
      'username.1': config.authorToWatch,
      'role.1': 'AUTHOR',
      limit: 30
    }))
    .pluck('data', 'values')
    .switchMap(values => observable.from(values))
    .filter(mergedPr => unmergedPrs.find(getEquals(mergedPr)))
    .do(removeFromUnmergedList);

  const getRelatedJiraKeys = (prId) => {
    const getIssuesUrl = `${REST_JIRA_URL}/pull-requests/${prId}/issues`;
    return ajaxGet(getIssuesUrl)
      .do(console.log)
      .pluck('data')
      .switchMap(jiraTickets => observable.from(jiraTickets))
      .do(console.log);
  };


  return {
    startObservingPrCreation,
    startPoolingForMerged,
    getRelatedJiraKeys
  };
};
