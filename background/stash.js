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
      unmerged: unmergedList
    });
  };

  const getEquals = (object) => {
    return ({ title = '', description = '' }) => {
      return (object.title || '') === title && description === (object.description || '');
    };
  };


  const addToUnmergedList = ({ title, description }) => {
    if (!unmergedPrs.find(getEquals({ title, description }))) {
      unmergedPrs.push({
        title,
        description
      });
      saveToLocalStorage(unmergedPrs);
    }
  };

  const removeFromUnmergedList = (pr) => {
    const index = unmergedPrs.findIndex(getEquals(pr));
    unmergedPrs.splice(index, 1);
    saveToLocalStorage(unmergedPrs);
  };

  const startObservingPrCreation = () => {
    const filteredUrls = [`${config.baseUrl}/projects/${config.project}/repos/${config.repository}/pull-requests?create`];
    return observable.create((observer) => {
      const onBeforeRequest = (details) => {
        if (details.method === 'POST') {
          const poolRequest = {
            title: details.requestBody.formData.title[0],
            description: details.requestBody.formData.description[0]
          };
          addToUnmergedList(poolRequest);
          observer.next(poolRequest);
          console.log('PR started being monitored');
        }

        return details;
      };

      webRequest.onBeforeRequest.addListener(onBeforeRequest, {
        urls: filteredUrls
      }, ['requestBody']);

      return function unsubscribe() {
        webRequest.onBeforeRequest.removeListener(onBeforeRequest);
      };
    });
  };

  const ajaxGet = (url, params) => ajax.get(url, params, {
    Authorization: getBasicAuthentication(config.username, config.password)
  });

  const startPoolingForMerged = ({ poolInterval = 3600000, }) => observable
    .interval(poolInterval)
    .switchMap(() => ajaxGet(`${REST_API_URL}/pull-requests`, {
      state: 'MERGED',
      'username.1': config.authorToWatch,
      'role.1': 'AUTHOR',
      limit: 30
    }))
    .pluck('data', 'values')
    .switchMap(values => observable.from(values))
    .filter((mergedPr) => {
      return unmergedPrs.find(getEquals(mergedPr));
    })
    .do(removeFromUnmergedList);

  const getRelatedJiraKeys = (prId) => {
    const getIssuesUrl = `${REST_JIRA_URL}/pull-requests/${prId}/issues`;
    return ajaxGet(getIssuesUrl)
      .pluck('data')
      .switchMap(jiraTickets => observable.from(jiraTickets))
      .do(console.log);
  };

  const getPoolRequest = ({ title, description }, state) => {
    const getOpenPrsUrl = `${REST_API_URL}/pull-requests`;
    return ajaxGet(getOpenPrsUrl, {
      state,
      limit: 36
    }).pluck('data', 'values')
      .switchMap(prs => observable.from(prs))
      .filter((pr) => {
        return getEquals({ title, description })(pr);
      });
  };

  return {
    startObservingPrCreation,
    startPoolingForMerged,
    getRelatedJiraKeys,
    getPoolRequest
  };
};
