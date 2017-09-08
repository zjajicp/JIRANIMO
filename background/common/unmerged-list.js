const UnmergedList = ({
  localStorage,
  getPrEqualsFn
}) => {
  let unmergedPrs;
  localStorage.get('unmerged', ({ unmerged = [] }) => {
    unmergedPrs = unmerged;
  });

  const saveToLocalStorage = (list) => {
    localStorage.set({
      unmerged: list
    });
  };

  const add = ({ title, description, destBranch }) => {
    if (!unmergedPrs.find(getPrEqualsFn({ title, description }))) {
      unmergedPrs.push({
        title,
        description,
        destBranch
      });
      saveToLocalStorage(unmergedPrs);
    }
  };

  const remove = (pr, removeFromLocalStorage) => {
    const index = unmergedPrs.findIndex(getPrEqualsFn(pr));
    unmergedPrs.splice(index, 1);
    if (removeFromLocalStorage) {
      saveToLocalStorage(unmergedPrs);
    }
  };

  const get = () => unmergedPrs;

  const find = pr => unmergedPrs.find(getPrEqualsFn(pr));

  return {
    add,
    remove,
    saveToLocalStorage,
    get,
    find
  };
};
