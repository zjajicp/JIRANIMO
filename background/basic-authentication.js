const getBasicAuthentication = (username, password) => {
  const suffix = btoa(`${username}:${password}`);
  return `Basic ${suffix}`;
};
