const Stash = function ({
  config,
  observable,
  getBasicAuthentication,
  ajax,
  localStorage,
  webRequest }) {
  let unmergedPrs = [{
    "title": "HOTFIX fixed issue with double banner",
    "description": "HOTFIX fixed issue with double banner"
  }];

  // localStorage.get('unmerged', ({ unmerged }) => {
  //   unmergedPrs = unmerged || [];
  // });

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


  const startObservingPrCreation = (prCreationPath) => {
    return observable.create((observer) => {
      webRequest.onBeforeRequest.addListener(
        (details) => {
          if (details.method !== 'POST') {
            return;
          }

          const { title, description } = details.requestBody.formData;
          addToUnmergedList({
            title,
            description
          });

          observer.next({
            title,
            description
          });
        }, {
          urls: [`${config.baseUrl}/${prCreationPath}`]
        }, ['requestBody']);
    });
  };

  const ajaxGet = (url, params) =>  ajax.get(url, params, {
      Authentication: getBasicAuthentication(config.username, config.password)
    });

  const startPoolingForMerged = ({ poolInterval = 3600000, mergedPrsPath }) => {
    return observable
      .interval(poolInterval)
      .mergeMap(() => ajaxGet(`${config.baseUrl}/${config.restApiPath}/${mergedPrsPath}`))
      .pluck('data', 'values')
      .switchMap(values => observable.from(values))
      .filter(mergedPr => unmergedPrs.find(getEquals(mergedPr)))
      .do(removeFromUnmergedList);
  };

  const getRelatedJiraKeys = (prId) => {
    const getIssuesUrl = `${config.baseUrl}/${config.jiraRestApiPath}/pull-requests/${prId}/issues`;
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
