const Stash = function ({
  config,
  observable,
  getBasicAuthentication,
  ajax,
  localStorage,
  webRequests }) {
  const unmergedPrs = [];
  const saveToLocalStorage = (unmergedList) => {
    localStorage.set({
      name: 'unmerged',
      value: JSON.stringify(unmergedList),
    });
  };

  const addToUnmergedList = (pr) => {
    unmergedPrs.push(pr);
    saveToLocalStorage(unmergedPrs);
  };

  const removeFromUnmergedList = (pr) => {
    const index = unmergedPrs.findIndex(({ id }) => pr.id === id);
    unmergedPrs.splice(index, 1);
    saveToLocalStorage(unmergedPrs);
  };


  const startObservingPrCreation = (prCreationPath) => {
    return observable.create((observer) => {
      webRequests.onCompleted.addListener(
        (details) => {
          addToUnmergedList(details);
          observer.next(details);
        },
        { urls: [prCreationPath] });
    });
  };

  const startPoolingForMerged = ({ poolInterval = 3600000 }) => {
    return observable.interval(poolInterval).map(() => {
      return observable
        .from(unmergedPrs)
        .switchMap(pr => {
          return ajax.get(`${config.apiUrl}/pull-requests/${pr.id}`, null, {
            Authentication: getBasicAuthentication(config.username, config.password)
          });
        })
        .filter(response => response.state === 'MERGED')
        .do(removeFromUnmergedList);
    });
  };


  return {
    startObservingPrCreation,
    startPoolingForMerged
  };
};
