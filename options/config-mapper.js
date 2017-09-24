const ConfigMapper = (function ConfigMapper() {
  const getElement = id => document.querySelector(`#${id}`);

  const getBranchToJobConfig = (mapperInputCount = 0, getMapperInputId = () => {}) => {
    return Array.from(Array(mapperInputCount))
      .map((elem, index) => getElement(getMapperInputId('branch', index)).value)
      .filter(elem => elem)
      .reduce((acc, branchName, index) => {
        return Object.assign({
          [branchName]: getElement(getMapperInputId('job', index)).value
        }, acc);
      }, {});
  };

  const getBranchToJobForm = (branchToJobConfig = {}, getMapperInputId = () => { }) => {
    return Object
      .keys(branchToJobConfig)
      .map((branchName, index) => [{
        name: getMapperInputId('branch', index),
        value: branchName
      }, {
        name: getMapperInputId('job', index),
        value: branchToJobConfig[branchName]
      }])
      .reduce((acc, subList) => acc.concat(subList), []);
  };

  const assoc = (path, value, object) => {
    const newObject = Object.assign({}, object);
    path.split('.').reduce((acc, propName, index, list) => {
      if (index === list.length - 1) {
        acc[propName] = value;
      } else if (!acc[propName]) {
        acc[propName] = {};
      }

      return acc[propName];
    }, newObject);

    return newObject;
  };
  const getConfigFromFormFields =
    ({ inputIds = [], brancToJobMapCount = 0, getMapperInputId = () => { }, configMap = {} }) => {
      const config = ['stash', 'jira', 'jenkins']
        .map((configSectionName) => {
          return inputIds
            .filter(id => id.startsWith(configSectionName) && configMap[id])
            .reduce((acc, id) => {
              const path = configMap[id];
              const value = getElement(id).value;
              return Object.assign({}, assoc(path, value, acc));
            }, {});
        })
        .reduce((acc, section) => Object.assign({}, acc, section), {});

      return Object.assign({}, config, {
        jenkins: Object.assign({}, config.jenkins, {
          branchToJobMapper: getBranchToJobConfig(brancToJobMapCount, getMapperInputId)
        })
      });
    };

  const getByPath = (pathString, object) => pathString
    .split('.')
    .reduce((acc, value) => acc && acc[value], object);

  const getFormFieldsFromConfig = (config, configMap, getMapperInputId) => {
    const fields = Object
      .keys(configMap)
      .map(inputId => ({
        name: inputId,
        value: getByPath(configMap[inputId], config)
      }));

    const branchToJobFields = getBranchToJobForm(getByPath('jenkins.branchToJobMapper', config), getMapperInputId);

    return fields.concat(branchToJobFields);
  };

  return {
    getFormFieldsFromConfig,
    getConfigFromFormFields,
  };
}());
