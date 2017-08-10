(function optionsScript({ observable }) {
  const formElems = {};

  const get = (formElemId) => {
    if (formElems[formElemId]) {
      return formElems[formElemId];
    }

    const elem = document.querySelector(`#${formElemId}`);
    formElems[formElemId] = elem;
    return elem;
  };

  const addClass = (elem, name) => {
    const className = elem.className;
    if (className.indexOf(name) === -1) {
      elem.className += ` ${name}`;
    }
  };

  const removeClass = (elem, name) => {
    elem.className = elem.className
      .split(' ')
      .filter(nameClass => nameClass !== name)
      .join(' ');
  };

  const getStoredConfig = (localStorage) => {
    return observable.create((observer) => {
      localStorage.get('config', ({ config = {} }) => {
        Object.keys(config).forEach((id) => {
          observer.next({
            name: id,
            value: config[id]
          });
        });
        observer.complete();
      });
    });
  };

  const notifyFormSaved = (query, message, hideAfter) => {
    const $elem = get(query);
    $elem.innerHTML = message;
    addClass($elem, 'fade-in');
    setTimeout(() => {
      removeClass($elem, 'fade-in');
    }, hideAfter);
  };

  // const getNeededPermissions = (formData) => {
  //   return observable.create(({ next, complete }) => {
  //     const stashPermission = `${formData.stash_base_url}/*`;
  //     const jiraPermission = `${formData.jira_api_url}/*`;
  //     chrome.permissions.getAll(({ origins }) => {
  //       let originsToRequest = [];
  //       if (!origins.includes(stashPermission)) {
  //         originsToRequest = originsToRequest.concat(stashPermission);
  //       }

  //       if (!origins.includes(jiraPermission)) {
  //         originsToRequest = originsToRequest.concat(jiraPermission);
  //       }

  //       if (originsToRequest.length) {
  //         next({
  //           origins: originsToRequest
  //         });
  //       }
  //       complete();
  //     });
  //   });
  // };


  observable.fromEvent(document, 'DOMContentLoaded')
    .switchMap(() => getStoredConfig(chrome.storage.local))
    .do(({ name, value = '' }) => {
      get(name).value = value;
    })
    .switchMap(() => observable.fromEvent(get('save_btn'), 'click'))
    .switchMap(() => Rx.Observable.of([
      'stash_username',
      'stash_password',
      'stash_author_to_watch',
      'stash_base_url',
      'stash_rest_api_path',
      'stash_rest_jira_path',
      'stash_project',
      'stash_repository',
      'stash_pool_interval',
      'jira_username',
      'jira_password',
      'jira_api_url']
      .reduce((formData, inputName) => Object.assign({
        [inputName]: get(inputName).value
      }, formData), {})))
    .subscribe((formData) => {
      chrome.storage.local.set({
        config: formData
      });
      notifyFormSaved('message', 'Config saved', 2000);
    });
}({
  observable: Rx.Observable
}));
