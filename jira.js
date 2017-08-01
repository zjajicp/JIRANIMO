const Jira = function ({ config, basicAuthentication, ajax }) {
  const { username, password, apiUrl } = config;

  const getUpdateTransitionPayload = (ticketData) => {
    const payload = {};
    const fields = {};

    if (ticketData.status) {
      payload.transition = ticketData.status;
    }

    if (ticketData.status) {
      fields.status = {
        id: ticketData.status.id,
      };
    }

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


  const updateTransition = (ticketId, updateData) => {
    const url = `${getUrl(apiUrl, ticketId)}/transitions`;
    return ajax.post(url, getUpdateTransitionPayload(updateData), {
      Authentication: basicAuthentication(username, password),
    });
  };

  const getTicket = (ticketId) => {
    const url = getUrl(apiUrl, ticketId);
    return ajax.get(url, null, {
      Authentication: basicAuthentication(username, password),
    });
  };

  return {
    updateTransition,
    getTicket,
  };
};
