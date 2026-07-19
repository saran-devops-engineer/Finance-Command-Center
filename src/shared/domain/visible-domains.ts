/**
 * FCC V2 — Five visible application domains.
 * Internal engines remain separate; these are navigation and UX boundaries.
 */

export const VisibleDomain = {
  HOME: "home",
  PRODUCTS: "products",
  COMMITMENTS: "commitments",
  INSIGHTS: "insights",
  PROFILE: "profile"
} as const;

export type VisibleDomainId = (typeof VisibleDomain)[keyof typeof VisibleDomain];

/** The four command-center questions every screen must support. */
export const CommandCenterQuestion = {
  WHAT_DO_I_OWN: "what-do-i-own",
  WHAT_DO_I_OWE: "what-do-i-owe",
  WHAT_MUST_I_PAY_NEXT: "what-must-i-pay-next",
  WHAT_SHOULD_I_DO_WITH_MONEY: "what-should-i-do-with-my-money"
} as const;

export type CommandCenterQuestionId =
  (typeof CommandCenterQuestion)[keyof typeof CommandCenterQuestion];

export const COMMAND_CENTER_QUESTION_LABELS: Record<CommandCenterQuestionId, string> = {
  [CommandCenterQuestion.WHAT_DO_I_OWN]: "What do I own?",
  [CommandCenterQuestion.WHAT_DO_I_OWE]: "What do I owe?",
  [CommandCenterQuestion.WHAT_MUST_I_PAY_NEXT]: "What must I pay next?",
  [CommandCenterQuestion.WHAT_SHOULD_I_DO_WITH_MONEY]: "What should I do with my money?"
};

/** Maps each visible domain to the primary question it answers. */
export const DOMAIN_PRIMARY_QUESTION: Record<VisibleDomainId, CommandCenterQuestionId> = {
  [VisibleDomain.HOME]: CommandCenterQuestion.WHAT_MUST_I_PAY_NEXT,
  [VisibleDomain.PRODUCTS]: CommandCenterQuestion.WHAT_DO_I_OWE,
  [VisibleDomain.COMMITMENTS]: CommandCenterQuestion.WHAT_MUST_I_PAY_NEXT,
  [VisibleDomain.INSIGHTS]: CommandCenterQuestion.WHAT_SHOULD_I_DO_WITH_MONEY,
  [VisibleDomain.PROFILE]: CommandCenterQuestion.WHAT_DO_I_OWN
};
