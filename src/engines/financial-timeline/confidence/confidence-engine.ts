import {
  ConfidenceLevel,
  type ConfidenceAssessment,
  type ConfidenceFactorResult,
  type ConfidenceLevelValue,
  type ConfirmationModeValue,
  type FinancialTimeline,
  type TimelineEvent
} from "@/shared/domain/financial-timeline";
import { daysBetween } from "@/engines/financial-timeline/scheduler/date-utils";
import { countPendingConfirmations } from "@/engines/financial-timeline/state/state-manager";

export interface ConfidenceEngineInput {
  timeline: FinancialTimeline;
  events: TimelineEvent[];
  referenceDate: string;
  confirmationMode: ConfirmationModeValue;
  historicalMissedCount?: number;
  historicalPrepaymentCount?: number;
}

interface ConfidenceFactor {
  id: string;
  label: string;
  weight: number;
  score: (input: ConfidenceEngineInput) => number;
}

const CONFIDENCE_FACTORS: ConfidenceFactor[] = [
  {
    id: "days_since_confirmation",
    label: "Days since last confirmation",
    weight: 0.3,
    score: ({ timeline, referenceDate }) => {
      const days = daysBetween(timeline.lastConfirmedState.asOfDate, referenceDate);
      if (days <= 7) return 100;
      if (days <= 30) return 85;
      if (days <= 90) return 60;
      if (days <= 180) return 40;
      return 20;
    }
  },
  {
    id: "pending_events",
    label: "Pending confirmation volume",
    weight: 0.25,
    score: ({ events }) => {
      const pending = countPendingConfirmations(events);
      if (pending === 0) return 100;
      if (pending === 1) return 90;
      if (pending <= 3) return 70;
      if (pending <= 6) return 45;
      return 25;
    }
  },
  {
    id: "payment_consistency",
    label: "Historical payment consistency",
    weight: 0.2,
    score: ({ historicalMissedCount = 0 }) => {
      if (historicalMissedCount === 0) return 95;
      if (historicalMissedCount <= 2) return 70;
      return 40;
    }
  },
  {
    id: "product_status",
    label: "Product status",
    weight: 0.15,
    score: ({ timeline }) => (timeline.status === "active" ? 90 : 50)
  },
  {
    id: "strategy_alignment",
    label: "User-selected strategy",
    weight: 0.1,
    score: ({ confirmationMode }) => {
      if (confirmationMode === "always_auto") return 100;
      if (confirmationMode === "smart_auto") return 85;
      if (confirmationMode === "ask_me") return 60;
      return 30;
    }
  }
];

export function evaluateConfidence(input: ConfidenceEngineInput): ConfidenceAssessment {
  const factors: ConfidenceFactorResult[] = CONFIDENCE_FACTORS.map((factor) => ({
    factorId: factor.id,
    label: factor.label,
    weight: factor.weight,
    score: factor.score(input)
  }));

  const score = Math.round(
    factors.reduce((sum, factor) => sum + factor.score * factor.weight, 0) /
      factors.reduce((sum, factor) => sum + factor.weight, 0)
  );

  let level: ConfidenceLevelValue = ConfidenceLevel.LOW;
  if (score >= 80) {
    level = ConfidenceLevel.HIGH;
  } else if (score >= 55) {
    level = ConfidenceLevel.MEDIUM;
  }

  return { score, level, factors };
}

export function isHighConfidence(score: number, threshold: number): boolean {
  return score >= threshold;
}
