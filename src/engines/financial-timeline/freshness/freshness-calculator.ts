import {
  FreshnessStatus,
  type FinancialTimeline,
  type FreshnessStatusValue,
  type TimelineEvent
} from "@/shared/domain/financial-timeline";
import { daysBetween } from "@/engines/financial-timeline/scheduler/date-utils";
import { countPendingConfirmations } from "@/engines/financial-timeline/state/state-manager";

export interface FreshnessResult {
  status: FreshnessStatusValue;
  score: 1 | 2 | 3 | 4 | 5;
  label: string;
}

export function calculateFreshness(
  timeline: FinancialTimeline,
  events: TimelineEvent[],
  referenceDate: string
): FreshnessResult {
  const daysSinceConfirmation = daysBetween(timeline.lastConfirmedState.asOfDate, referenceDate);
  const pending = countPendingConfirmations(events);

  if (pending >= 3) {
    return {
      status: FreshnessStatus.NEEDS_REVIEW,
      score: 3,
      label: `${pending} pending confirmations`
    };
  }

  if (daysSinceConfirmation <= 1) {
    return { status: FreshnessStatus.FRESH, score: 5, label: "Last confirmed yesterday" };
  }

  if (daysSinceConfirmation <= 10) {
    return { status: FreshnessStatus.GOOD, score: 4, label: "Last confirmed recently" };
  }

  if (daysSinceConfirmation <= 90) {
    return {
      status: FreshnessStatus.NEEDS_REVIEW,
      score: 3,
      label: `${pending} pending confirmations`
    };
  }

  if (daysSinceConfirmation <= 180) {
    return {
      status: FreshnessStatus.NEEDS_ATTENTION,
      score: 2,
      label: `${daysSinceConfirmation} days since confirmation`
    };
  }

  return {
    status: FreshnessStatus.STALE,
    score: 1,
    label: "Over 6 months without confirmation"
  };
}
