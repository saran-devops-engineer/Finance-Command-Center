/**
 * FCC Event Taxonomy V1 — frozen standard actions.
 * New actions require architecture review.
 */
export const StandardActions = {
  OPENED: "OPENED",
  VIEWED: "VIEWED",
  CREATED: "CREATED",
  UPDATED: "UPDATED",
  ARCHIVED: "ARCHIVED",
  DELETED: "DELETED",
  STARTED: "STARTED",
  COMPLETED: "COMPLETED",
  USED: "USED",
  RESTORED: "RESTORED",
  EXPORTED: "EXPORTED",
  IMPORTED: "IMPORTED",
  SUBMITTED: "SUBMITTED",
  CHANGED: "CHANGED",
  FAILED: "FAILED",
  ERROR_OCCURRED: "ERROR_OCCURRED"
} as const;

export type StandardAction = (typeof StandardActions)[keyof typeof StandardActions];
