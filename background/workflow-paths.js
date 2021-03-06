const WorkflowPaths = ({ JIRA_STATUSES, ISSUE_TYPES }) => {
  const WORKFLOWS = {
    [ISSUE_TYPES.STORY.ID]: {
      OPEN_PR: [[
        JIRA_STATUSES[ISSUE_TYPES.STORY.ID].START_PROGRESS_FROM_OPEN,
        JIRA_STATUSES[ISSUE_TYPES.STORY.ID].CODE_REVIEW,
      ], [
        JIRA_STATUSES[ISSUE_TYPES.STORY.ID].START_PROGRESS_FROM_REOPEN,
        JIRA_STATUSES[ISSUE_TYPES.STORY.ID].CODE_REVIEW
      ], [
        JIRA_STATUSES[ISSUE_TYPES.STORY.ID].CODE_REVIEW_FROM_BLOCKED
      ]],
      MERGED_PR: [[
        JIRA_STATUSES[ISSUE_TYPES.STORY.ID].START_PROGRESS_FROM_OPEN,
        JIRA_STATUSES[ISSUE_TYPES.STORY.ID].CODE_REVIEW,
        JIRA_STATUSES[ISSUE_TYPES.STORY.ID].MOVE_TO_TEST
      ], [
        JIRA_STATUSES[ISSUE_TYPES.STORY.ID].START_PROGRESS_FROM_REOPEN,
        JIRA_STATUSES[ISSUE_TYPES.STORY.ID].CODE_REVIEW,
        JIRA_STATUSES[ISSUE_TYPES.STORY.ID].MOVE_TO_TEST
      ], [
        JIRA_STATUSES[ISSUE_TYPES.STORY.ID].CODE_REVIEW_FROM_BLOCKED,
        JIRA_STATUSES[ISSUE_TYPES.STORY.ID].MOVE_TO_TEST
      ], [
        JIRA_STATUSES[ISSUE_TYPES.STORY.ID].MERGE_TO_DEV,
        JIRA_STATUSES[ISSUE_TYPES.STORY.ID].READY_FOR_TEST_FROM_MERGE_TO_DEV
      ]]
    },
    [ISSUE_TYPES.BUG.ID]: {
      OPEN_PR: [[
        JIRA_STATUSES[ISSUE_TYPES.BUG.ID].START_PROGRESS_FROM_OPEN,
        JIRA_STATUSES[ISSUE_TYPES.BUG.ID].CODE_REVIEW,
      ], [
        JIRA_STATUSES[ISSUE_TYPES.BUG.ID].START_PROGRESS_FROM_REOPEN,
        JIRA_STATUSES[ISSUE_TYPES.BUG.ID].CODE_REVIEW
      ], [
        JIRA_STATUSES[ISSUE_TYPES.BUG.ID].CODE_REVIEW_FROM_BLOCKED
      ]],
      MERGED_PR: [[
        JIRA_STATUSES[ISSUE_TYPES.BUG.ID].START_PROGRESS_FROM_OPEN,
        JIRA_STATUSES[ISSUE_TYPES.BUG.ID].CODE_REVIEW,
        JIRA_STATUSES[ISSUE_TYPES.BUG.ID].MOVE_TO_TEST
      ], [
        JIRA_STATUSES[ISSUE_TYPES.BUG.ID].START_PROGRESS_FROM_REOPEN,
        JIRA_STATUSES[ISSUE_TYPES.BUG.ID].CODE_REVIEW,
        JIRA_STATUSES[ISSUE_TYPES.BUG.ID].MOVE_TO_TEST
      ], [
        JIRA_STATUSES[ISSUE_TYPES.BUG.ID].CODE_REVIEW_FROM_BLOCKED,
        JIRA_STATUSES[ISSUE_TYPES.BUG.ID].MOVE_TO_TEST
      ], [
        JIRA_STATUSES[ISSUE_TYPES.BUG.ID].MERGE_TO_DEV,
        JIRA_STATUSES[ISSUE_TYPES.BUG.ID].READY_FOR_TEST_FROM_MERGE_TO_DEV
      ]]
    },
    [ISSUE_TYPES.SUB_TASK.ID]: {
      OPEN_PR: [[
        JIRA_STATUSES[ISSUE_TYPES.SUB_TASK.ID].IN_PROGRESS,
      ], [
        JIRA_STATUSES[ISSUE_TYPES.SUB_TASK.ID].REOPENED,
        JIRA_STATUSES[ISSUE_TYPES.SUB_TASK.ID].IN_PROGRESS,
      ]],
      MERGED_PR: [[
        JIRA_STATUSES[ISSUE_TYPES.SUB_TASK.ID].IN_PROGRESS,
        JIRA_STATUSES[ISSUE_TYPES.SUB_TASK.ID].DONE
      ], [
        JIRA_STATUSES[ISSUE_TYPES.SUB_TASK.ID].REOPENED,
        JIRA_STATUSES[ISSUE_TYPES.SUB_TASK.ID].IN_PROGRESS,
        JIRA_STATUSES[ISSUE_TYPES.SUB_TASK.ID].DONE
      ]]
    },
  };

  return {
    get(statusPathType, issueTypeId) {
      return WORKFLOWS[issueTypeId][statusPathType];
    },
    STATUS_PATH_TYPES: {
      OPEN_PR: 'OPEN_PR',
      MERGED_PR: 'MERGED_PR'
    }
  };
};
