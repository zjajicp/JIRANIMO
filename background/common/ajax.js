const Ajax = function Ajax({ observable }) {
  const setHeaders = (headers, xhr) => {
    Object.keys(headers).forEach((headerName) => {
      xhr.setRequestHeader(headerName, headers[headerName]);
    });
  };

  const getResponsePayload = (xhr) => {
    try {
      return {
        status: xhr.status,
        data: JSON.parse(xhr.responseText)
      };
    } catch (err) {
      return {
        status: xhr.status,
        data: {}
      };
    }
  };

  const getEncodedParams = (params) => {
    const paramNames = Object.keys(params || {});
    const encodedParams = paramNames.reduce((acc, paramName, index) => {
      const encodedUrl = encodeURI(`${paramName}=${params[paramName]}`);
      const suffix = (index < (paramNames.length - 1)) ? '&' : '';
      return `${acc}${encodedUrl}${suffix}`;
    }, '');

    return encodedParams && `?${encodedParams}`;
  };

  const isSuccess = statusCode => statusCode >= 200 && statusCode < 300;

  const get = (url, params, headers) => {
    return observable.create((observer) => {
      const xhr = new XMLHttpRequest();
      const encodedUrl = `${url}${getEncodedParams(params)}`;
      xhr.open('GET', encodedUrl);
      setHeaders(headers, xhr);
      xhr.addEventListener('load', () => {
        if (isSuccess(xhr.status)) {
          observer.next(getResponsePayload(xhr));
          observer.complete();
        } else {
          observer.error(getResponsePayload(xhr));
        }
      });
      xhr.send();
    });
  };

  const toObservable = (method, url, params, headers) => {
    return observable.create((observer) => {
      const xhr = new XMLHttpRequest();
      xhr.open(method, url);
      setHeaders(Object.assign(headers, {
        'content-type': 'application/json'
      }), xhr);

      xhr.addEventListener('load', () => {
        if (isSuccess(xhr.status)) {
          observer.next(getResponsePayload(xhr));
          observer.complete();
        } else {
          observer.error(getResponsePayload(xhr));
        }
      });

      xhr.send(JSON.stringify(params));
    });
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
