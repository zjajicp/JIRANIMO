(function optionsScript({ observable, branchToJobMapper }) {
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
        const inputs = config.inputs || {};
        Object.keys(inputs).forEach((id) => {
          observer.next({
            name: id,
            value: inputs[id]
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

  const getMapperInputId = (type, index) => `jenkins_mapper_${type}_${index}`;

  const getBranchToJobConfig = (inputIds) => {
    const isBranchNameInput = /jenkins_mapper_branch_\d/;
    const brancNameInputCount = inputIds.filter(id => isBranchNameInput.test(id)).length;
    return Array.from(Array(brancNameInputCount))
      .map((elem, index) => get(getMapperInputId('branch', index)).value)
      .filter(elem => elem)
      .reduce((acc, branchName, index) => {
        return Object.assign({
          [branchName]: get(getMapperInputId('job', index)).value
        }, acc);
      }, {});
  };

  const domContentLoaded = observable.fromEvent(document, 'DOMContentLoaded');

  domContentLoaded.do(() => {
    const placeholder = document.querySelector('.branch-job-mapper');
    Array.from(Array(5)).forEach((elem, index) => {
      const { element } = branchToJobMapper.get(
        getMapperInputId('branch', index),
        getMapperInputId('job', index));
      placeholder.appendChild(element);
    });
  })
    .switchMap(() => getStoredConfig(chrome.storage.local))
    .subscribe(({ name, value = '' }) => {
      get(name).value = value;
    });

  domContentLoaded
    .switchMap(() => observable.fromEvent(get('save_btn'), 'click'))
    .switchMap(() => {
      const form = document.querySelector('.form');
      const inputIds = Array.from(form.querySelectorAll('input')).map(element => element.id);
      const branchToJobMap = getBranchToJobConfig(inputIds);
      const inputsConfig = inputIds
        .reduce((formData, inputName) => Object.assign({
          [inputName]: get(inputName).value
        }, formData), {});

      return Rx.Observable.of({
        inputs: inputsConfig,
        branchToJobMap
      });
    })
    .subscribe((config) => {
      chrome.storage.local.set({
        config
      });
      notifyFormSaved('message', 'Config saved', 2000);
    });
}({
  observable: Rx.Observable,
  branchToJobMapper
}));
