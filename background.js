const ajax = Ajax({
  fetch
});

const jira = Jira({
  ajax,
  basicAuthentication: getBasicAuthentication,
  config: {
    username: 'zjajicp',
    password: 'Meeting555',
    apiUrl: 'https://jira.ryanair.com:8443/rest/api/2'
  }
});

jira.updateTransition('RW-24684', {
  status: JIRA_STATUSES.CODE_REVIEW
}).subscribe(() => {
  console.log('updated');
}, (err) => {
  console.error(err);
});
