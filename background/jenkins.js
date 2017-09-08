const Jenkins = function ({ observable, ajax, basicAuthentication, config }) {
  const getJobInfo = job => ajax.get(`${config.baseUrl}/job/${job}/api/json`, null, {
    Authorization: basicAuthentication(config.username, config.password),
  });

  const getCurrentBuildNumber = job => getJobInfo(job).pluck('data', 'lastSuccessfulBuild', 'number');

  const isDeployed = (job, lastSuccessfulBuild) => getCurrentBuildNumber(job)
    .map(buildNumber => buildNumber > lastSuccessfulBuild);

  const waitForNextDeploy = (job, poolInterval) => getCurrentBuildNumber(job)
    .switchMap(lastSuccessfulBuild => observable.create((observer) => {
      const intervalSubscription = observable
        .interval(poolInterval)
        .switchMap(() => isDeployed(job, lastSuccessfulBuild))
        .subscribe({
          next(deployed) {
            if (deployed) {
              intervalSubscription.unsubscribe();
              observer.next(deployed);
              observer.complete();
            }
          }
        });

      return () => {
        intervalSubscription.unsubscribe();
      };
    }));

  return {
    isDeployed,
    getCurrentBuildNumber,
    waitForNextDeploy
  };
};
