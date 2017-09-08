const Utils = {
  getBasicAuthentication: (username, password) => {
    const suffix = btoa(`${username}:${password}`);
    return `Basic ${suffix}`;
  },
  getPrEqualsFn: (object) => {
    return ({ title = '', description = '' }) => {
      return (object.title || '').trim() === title.trim() && description.trim() === (object.description || '').trim();
    };
  }
};
