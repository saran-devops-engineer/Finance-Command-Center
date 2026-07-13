/** Chits — answers: Are users adopting the Chit module? */
export const ChitEvents = {
  CHIT_CREATED: "CHIT_CREATED",
  CHIT_UPDATED: "CHIT_UPDATED",
  CHIT_ARCHIVED: "CHIT_ARCHIVED",
  CHIT_DELETED: "CHIT_DELETED",
  CHIT_VIEWED: "CHIT_VIEWED"
} as const;

export type ChitEventName = (typeof ChitEvents)[keyof typeof ChitEvents];

export interface ChitEventPayloadMap {
  CHIT_CREATED: { chit_id: string };
  CHIT_UPDATED: { chit_id: string };
  CHIT_ARCHIVED: { chit_id: string };
  CHIT_DELETED: { chit_id: string };
  CHIT_VIEWED: { chit_id: string };
}
