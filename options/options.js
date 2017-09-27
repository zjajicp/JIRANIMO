(function optionsScript({ observable, branchToJobMapper, ConfigMapper, formatJson }) {
  const formElems = {};

  const get = (formElemId) => {
    if (formElems[formElemId]) {
      return formElems[formElemId];
    }

    const elem = document.querySelector(`#${formElemId}`);
    formElems[formElemId] = elem;
    return elem;
  };

  const addClass = (elem, classAttribute) => {
    const classNamesToAdd = classAttribute.split(' ');
    const currentClassName = elem.className;
    elem.className = classNamesToAdd.reduce((acc, cName) => {
      if (currentClassName.indexOf(cName) === -1) {
        return `${acc} ${cName}`;
      }
      return acc;
    }, currentClassName);
  };

  const removeClass = (elem, name) => {
    const classesToRemove = name.split(' ');
    elem.className = elem.className
      .split(' ')
      .filter(nameClass => classesToRemove.indexOf(nameClass) === -1)
      .join(' ');
  };

  const getStoredConfig = (localStorage) => {
    return observable.create((observer) => {
      localStorage.get('config', ({ config = {} }) => {
        observer.next(config);
        observer.complete();
      });
    });
  };

  const notifyFormSaved = (query, message = 'Config saved', hideAfter = 5000) => {
    const $elem = get(query);
    $elem.innerHTML = message;
    addClass($elem, 'fade-in');
    setTimeout(() => {
      removeClass($elem, 'fade-in');
    }, hideAfter);
  };

  const BRANCH_TO_JOB_COUNT = 5;
  const FORM_TO_CONFIG_MAP = {
    stash_username: 'stash.username',
    stash_password: 'stash.password',
    stash_base_url: 'stash.baseUrl',
    stash_rest_api_path: 'stash.restApiPath',
    stash_rest_jira_path: 'stash.restJiraPath',
    stash_project: 'stash.project',
    stash_repository: 'stash.repository',
    stash_pool_interval: 'stash.poolInterval',
    stash_author_to_watch: 'stash.authorToWatch',
    jira_username: 'jira.username',
    jira_password: 'jira.password',
    jira_rest_api_url: 'jira.restApiUrl',
    jenkins_username: 'jenkins.username',
    jenkins_password: 'jenkins.password',
    jenkins_base_url: 'jenkins.baseUrl',
    jenkins_pool_interval: 'jenkins.poolInterval',
  };

  const getMapperInputId = (type, index) => `jenkins_mapper_${type}_${index}`;

  const domContentLoaded = observable.fromEvent(document, 'DOMContentLoaded').share();

  const loadConfig = getStoredConfig(chrome.storage.local)
    .do((config) => {
      get('json_config').value = formatJson(JSON.stringify(config));
    })
    .map(config => ConfigMapper.getFormFieldsFromConfig(config, FORM_TO_CONFIG_MAP, getMapperInputId))
    .switchMap(list => observable.from(list))
    .do(({ name, value = '' }) => {
      get(name).value = value;
    });

  

  domContentLoaded.do(() => {
    const placeholder = document.querySelector('.branch-job-mapper');
    Array.from(Array(BRANCH_TO_JOB_COUNT)).forEach((elem, index) => {
      const { element } = branchToJobMapper.get(
        getMapperInputId('branch', index),
        getMapperInputId('job', index));
      placeholder.appendChild(element);
    });
  })
    .switchMap(() => loadConfig)
    .subscribe(() => {
      console.log('Config loaded');
    });

  const tabs = ['form-tab', 'json-tab'];
  const switchTab = (tabId) => {
    const getContentElem = (id) => {
      const contentId = get(id).getAttribute('content-id');
      return get(contentId);
    };

    addClass(get(tabId), 'active');
    removeClass(getContentElem(tabId), 'hide');
    tabs.filter(tab => tab !== tabId).forEach((tab) => {
      addClass(getContentElem(tab), 'hide');
      removeClass(get(tab), 'active');
    });
  };

  domContentLoaded
    .switchMap(() => observable.from(tabs))
    .mergeMap(tabId => observable.fromEvent(get(tabId), 'click'))
    .pluck('target', 'id')
    .do(switchTab)
    .switchMap(() => loadConfig)
    .subscribe(() => {
      console.log('Tab switched');
    });

  observable.fromEvent(get('save_json_btn'), 'click')
    .map(() => get('json_config'))
    .pluck('value')
    .map(jsonConfig => JSON.parse(jsonConfig))
    .retryWhen(errors => errors.switchMap(error => {
      notifyFormSaved('error', error.message);
      return observable.of(null);
    }))
    .subscribe((config) => {
      chrome.storage.local.set({
        config
      });
      notifyFormSaved('message-json');
    });

  domContentLoaded
    .switchMap(() => observable.fromEvent(get('save_btn'), 'click'))
    .switchMap(() => {
      const inputIds = Object.keys(FORM_TO_CONFIG_MAP);
      const config = ConfigMapper.getConfigFromFormFields({
        inputIds,
        brancToJobMapCount: BRANCH_TO_JOB_COUNT,
        getMapperInputId,
        configMap: FORM_TO_CONFIG_MAP
      });
      return Rx.Observable.of(config);
    })
    .subscribe((config) => {
      chrome.storage.local.set({
        config
      });
      notifyFormSaved('message');
    });
}({
  observable: Rx.Observable,
  branchToJobMapper,
  ConfigMapper,
  formatJson
}));
