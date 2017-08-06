const ConfigLoader = ({
  storage,
  observable
}) => {
  const load = (storageKey) => {
    return observable.create((observer) => {
      storage.local.get(storageKey, (details) => {
        if (details[storageKey]) {
          observer.next(details.config);
        }
      });

      const onStorageChange = (data) => {
        if (data[storageKey]) {
          observer.next(data[storageKey].newValue);
        }
      };

      storage.onChanged.addListener(onStorageChange);

      return function tearDown() {
        storage.onChanged.removeListener(onStorageChange);
      };
    });
  };

  return {
    load
  };
};
