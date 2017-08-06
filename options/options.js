(function optionsScript() {
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

  const restore = () => {
    chrome.storage.local.get('config', ({ config = {} }) => {
      Object.keys(config).forEach((id) => {
        get(id).value = config[id] || '';
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

  const getOnSave = (inputIds) => () => {
    const formModel = inputIds.reduce((acc, id) => Object.assign(acc, {
      [id]: get(id).value
    }), {});

    chrome.storage.local.set({
      config: formModel
    });
    notifyFormSaved('message', 'Config saved', 2000);
  };

  const loadScript = () => {
    const inputIds = [
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
      'jira_api_url'];

    restore();
    get('save_btn').addEventListener('click', getOnSave(inputIds));
  };
  document.addEventListener('DOMContentLoaded', loadScript);
}());
