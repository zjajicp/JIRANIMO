const branchToJobMapper = (function () {
  const getElement = (tagName, { id, className = '', placeholder }) => {
    const element = document.createElement(tagName);
    element.className = className;
    if (id) {
      element.id = id;
    }

    if (placeholder) {
      element.placeholder = placeholder;
    }

    return element;
  };

  const getFormControl = () => getElement('div', { className: 'form-control form-control--flexable' });

  const getFormControlInput = (id, placeholder) => getElement('input', {
    className: 'form-control__input',
    placeholder,
    id
  });

  const getArrow = () => {
    const arrowWrapper = getElement('div', { className: 'arrow' });
    const arrowBody = getElement('div', { className: 'arrow__body' });
    const arrowLine = getElement('div', { className: 'arrow__line' });

    arrowWrapper.appendChild(arrowLine);
    arrowWrapper.appendChild(arrowBody);
    return arrowWrapper;
  };

  const getBranchToJobMapper = (branchNameInputId, jobNameInputId) => {
    const formControl = getFormControl();
    const branchNameInput = getFormControlInput(branchNameInputId, 'Branch name');
    formControl.appendChild(branchNameInput);
    formControl.appendChild(getArrow());
    const jobNameInput = getFormControlInput(jobNameInputId, 'Jenkins job name');
    formControl.appendChild(jobNameInput);
    return {
      element: formControl,
      brancNameElement: branchNameInput,
      jobNameElement: jobNameInput
    };
  };

  return {
    get: getBranchToJobMapper
  };
}());
