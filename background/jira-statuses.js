const JIRA_STATUSES = {
  REOPENED: {
    code: '311',
    name: 'Reopened'
  },
  CODE_REVIEW: {
    code: '21',
    name: 'Code Review'
  },
  CODE_REVIEW_FROM_BLOCKED: {
    code: '241',
    name: 'Code review'
  },
  MOVE_TO_TEST: {
    code: '31',
    name: 'In Test'
  },
  START_PROGRESS_FROM_REOPEN: {
    code: '291',
    name: 'In Progress'
  },
  START_PROGRESS_FROM_OPEN: {
    code: '11',
    name: 'In Progress'
  },
  FIX_TO_MASTER: {
    code: '361',
    name: 'Fixed on master'
  },
  REJECTED: {
    code: '331',
    name: 'Rejected'
  },
  MERGE_TO_DEV: {
    code: '51',
    name: 'Merge to Dev'
  },
  READY_FOR_TEST_FROM_MERGE_TO_DEV: {
    code: '61',
    name: 'Ready for test'
  }
};
