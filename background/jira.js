const Jira = function ({ config, basicAuthentication, ajax, observable }) {
  const { username, password, apiUrl } = config;

  const getUpdateTicketPayload = (ticketData) => {
    const payload = {};
    const fields = {};

    if (ticketData.projectKey) {
      fields.project = {
        key: ticketData.projectKey,
      };
    }

    if (ticketData.title) {
      fields.summary = ticketData.title;
    }

    if (ticketData.assigneeName) {
      fields.assignee = {
        name: ticketData.assigneeName,
      };
    }

    if (ticketData.priority) {
      fields.priority = {
        id: ticketData.priority,
      };
    }

    if (ticketData.description) {
      fields.description = ticketData.description;
    }

    return Object.assign(payload, {
      fields,
    });
  };

  const getUrl = (baseUrl, ticketId) => {
    return `${baseUrl}/issue${(ticketId ? `/${ticketId}` : '')}`;
  };

  const updateTicketData = (ticketId, updateData) => {
    const url = getUrl(apiUrl, ticketId);
    return ajax.put(url, getUpdateTicketPayload(updateData), {
      Authorization: basicAuthentication(username, password)
    });
  };

  const updateTransition = (ticketId, updateData) => {
    const url = `${getUrl(apiUrl, ticketId)}/transitions`;
    return ajax.post(url, {
      transition: updateData.status
    }, {
      Authorization: basicAuthentication(username, password),
    }).mergeMap(() => updateTicketData(ticketId, updateData));
  };

  const isNotAllowedTransitionError = errData => errData.status === 400 &&
    errData.data.errorMessages &&
    errData.data.errorMessages[0].startsWith('It seems that you have tried to perform a workflow operation');

  const getCleaner = (subscriptions) => {
    return () => {
      subscriptions.forEach(subscription => {
        subscription.unsubscribe();
      })
    };
  };

  const updateTransitionWithPath = (ticketId, updateData) => {
    return observable.create((observer) => {
      const path = updateData.statusPath;
      let pathIndex = path.length - 1;
      const subscriptions = [];
      (function update(status) {
        const subscription = updateTransition(ticketId, Object.assign({
          status
        }, updateData))
          .catch((errData) => {
            pathIndex -= 1;
            if (isNotAllowedTransitionError(errData) && pathIndex >= 0) {
              update(path[pathIndex]);
            } else {
              observer.error(errData);
            }
          })
          .subscribe((data) => {
            if (pathIndex === path.length - 1) {
              observer.next(data);
              observer.complete();
            } else {
              pathIndex += 1;
              update(path[pathIndex]);
            }
          });

        subscriptions.push(subscription);
      }(path[pathIndex]));

      return getCleaner(subscriptions);
    });
  };

  const updateTransitionWithManyPaths = (ticketId, updateData) => {
    return observable.create((observer) => {
      const paths = updateData.statusPaths;
      let index = 0;
      const subscriptions = [];
      (function update(path) {
        const subscription = updateTransitionWithPath(ticketId, Object.assign({
          statusPath: path
        }, updateData))
          .subscribe({
            next(data) {
              observer.next(data);
            },
            error(errData) {
              index += 1;
              if (isNotAllowedTransitionError(errData) && index < paths.length) {
                update(paths[index]);
              } else {
                observer.error(errData);
              }
            }
          });

        subscriptions.push(subscription);
      }(paths[index]));

      return getCleaner(subscriptions);
    });
  };

  const getTicket = (ticketId) => {
    const url = getUrl(apiUrl, ticketId);
    return ajax.get(url, null, {
      Authorization: basicAuthentication(username, password),
    });
  };

  return {
    updateTransition,
    getTicket,
    updateTicketData,
    updateTransitionWithPath,
    updateTransitionWithManyPaths
  };
};
