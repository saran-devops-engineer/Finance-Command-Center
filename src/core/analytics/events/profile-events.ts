/** Profile — answers: Are users personalizing their command center? */
export const ProfileEvents = {
  PROFILE_CREATED: "PROFILE_CREATED",
  PROFILE_UPDATED: "PROFILE_UPDATED"
} as const;

export type ProfileEventName = (typeof ProfileEvents)[keyof typeof ProfileEvents];

export interface ProfileEventPayloadMap {
  PROFILE_CREATED: undefined;
  PROFILE_UPDATED: undefined;
}
