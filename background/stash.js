const Stash = function ({
  config,
  observable,
  getBasicAuthentication,
  ajax,
  webRequest,
  getPrEqualsFn }) {
  const REST_API_URL = `${config.baseUrl}/${config.restApiPath}/projects/${config.project}/repos/${config.repository}`;
  const REST_JIRA_URL = `${config.baseUrl}/${config.restJiraPath}/projects/${config.project}/repos/${config.repository}`;

  const branchNameMatcher = /refs\/heads\/(.+)/;
  const getBranchName = fullName => fullName.match(branchNameMatcher)[1];

  const startObservingPrCreation = () => {
    const filteredUrls = [`${config.baseUrl}/projects/${config.project}/repos/${config.repository}/pull-requests?create`];

    return observable.create((observer) => {
      const onBeforeRequest = (details) => {
        if (details.method === 'POST') {
          const poolRequest = {
            title: details.requestBody.formData.title[0],
            description: details.requestBody.formData.description[0],
            destBranch: getBranchName(details.requestBody.formData.toBranch[0])
          };

          observer.next(poolRequest);
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

  const startPoolingForMerged = ({ poolInterval = 3600000 }) => observable
    .interval(poolInterval)
    .switchMap(() => ajaxGet(`${REST_API_URL}/pull-requests`, {
      state: 'MERGED',
      'username.1': config.authorToWatch,
      'role.1': 'AUTHOR',
      limit: 30
    }))
    .pluck('data', 'values')
    .switchMap(values => observable.from(values));

  const getRelatedJiraKeys = (prId) => {
    const getIssuesUrl = `${REST_JIRA_URL}/pull-requests/${prId}/issues`;
    return ajaxGet(getIssuesUrl)
      .pluck('data')
      .switchMap(jiraTickets => observable.from(jiraTickets));
  };

  const getPoolRequest = ({ title, description }, state) => {
    const getOpenPrsUrl = `${REST_API_URL}/pull-requests`;
    return ajaxGet(getOpenPrsUrl, {
      state,
      limit: 36
    }).pluck('data', 'values')
      .switchMap(prs => observable.from(prs))
      .filter(pr => getPrEqualsFn({ title, description })(pr))
      .do((pr) => {
        console.log('PR creation succesffuly observed: ', pr);
      });
  };

  return {
    startObservingPrCreation,
    startPoolingForMerged,
    getRelatedJiraKeys,
    getPoolRequest
  };
};
