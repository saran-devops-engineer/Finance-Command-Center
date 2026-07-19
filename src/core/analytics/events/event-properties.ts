/**
 * FCC Event Taxonomy V1 — shared property definitions.
 *
 * Automatically attached to every event (never set manually in features):
 * app_version, platform, browser, operating_system, timestamp, analytics_provider
 */

export const ScreenName = {
  HOME: "Home",
  PRODUCTS: "Products",
  COMMITMENTS: "Commitments",
  LOANS: "Loans",
  GOLD_LOAN: "Gold Loan",
  CHITS: "Chits",
  PROFILE: "Profile",
  SETTINGS: "Settings",
  MONEY: "Money",
  INSIGHTS: "Insights",
  SIMULATOR: "Simulator"
} as const;

export type ScreenNameValue = (typeof ScreenName)[keyof typeof ScreenName];

export interface AutomaticEventProperties {
  app_version: string;
  platform: string;
  browser: string;
  operating_system: string;
  timestamp: string;
  analytics_provider: string;
}

export interface OptionalEventProperties {
  screen_name?: ScreenNameValue;
  module_version?: string;
}

export type EventCategory =
  | "Application"
  | "Onboarding"
  | "Screen"
  | "Home Loan"
  | "Gold Loan"
  | "Chits"
  | "Simulator"
  | "Money"
  | "Backup"
  | "Profile"
  | "Settings"
  | "Feedback"
  | "Errors"
  | "Migration"
  | "Commitments"
  | "Products"
  | "Income";
