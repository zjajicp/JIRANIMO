const Ajax = function(fetch) {
  const handleResolvment = (response) => {
    if (response.status === 200) {
      return response.toJson();
    }

    return Promise.reject(response);
  };

  const get = (url, params, headers) => {
    const promise = fetch(url, {
      method: 'GET',
      headers
    }).then(handleResolvment);

    return Rx.Observable.fromPromise(promise);
  };

  const toObservable = (method, url, params, headers) => {
    const promise = fetch(url, {
      method,
      headers: Object.assign(headers, {
        'Content-Type': 'application/json'
      }),
      body: JSON.stringify(params)
    }).then(handleResolvment);

    return Rx.Observable.fromPromise(promise);
  };
  const post = (url, params, headers) => {
    return toObservable('POST', url, params, headers);
  };

  const put = (url, params, headers) => {
    return toObservable('PUT', url, params, headers);
  };

  return {
    get,
    post,
    put
  };
};
