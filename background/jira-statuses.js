const JiraStatuses = function ({ ISSUE_TYPES }) {
  const STORY_STATUSES = {
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

  const BUG_STATUSES = STORY_STATUSES;

  const SUB_TASK_STATUSES = {
    REOPENED: {
      code: '31',
      name: 'Reopened'
    },
    IN_PROGRESS: {
      code: '11',
      name: 'Start'
    },
    DONE: {
      code: '21',
      name: 'Done'
    }
  };

  return {
    [ISSUE_TYPES.STORY.ID]: STORY_STATUSES,
    [ISSUE_TYPES.BUG.ID]: BUG_STATUSES,
    [ISSUE_TYPES.SUB_TASK.ID]: SUB_TASK_STATUSES
  };
};
