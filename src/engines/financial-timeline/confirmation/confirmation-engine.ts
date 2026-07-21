import type {
  ConfirmationModeValue,
  ConfirmationReviewPrompt,
  TimelineEvent
} from "@/shared/domain/financial-timeline";
import {
  evaluateConfidence,
  isHighConfidence,
  type ConfidenceEngineInput
} from "@/engines/financial-timeline/confidence/confidence-engine";
import { countPendingConfirmations } from "@/engines/financial-timeline/state/state-manager";

export interface ConfirmationStrategyContext extends ConfidenceEngineInput {
  smartAutoThreshold: number;
}

export interface ConfirmationStrategyResult {
  autoConfirmEventIds: string[];
  reviewPrompt: ConfirmationReviewPrompt | null;
}

export interface ConfirmationStrategy {
  readonly mode: ConfirmationModeValue;
  evaluate(context: ConfirmationStrategyContext): ConfirmationStrategyResult;
}

function pendingEvents(events: TimelineEvent[]): TimelineEvent[] {
  return events.filter((event) => event.status === "pending_confirmation");
}

export class ManualConfirmationStrategy implements ConfirmationStrategy {
  readonly mode = "manual" as const;

  evaluate(): ConfirmationStrategyResult {
    return { autoConfirmEventIds: [], reviewPrompt: null };
  }
}

export class AskConfirmationStrategy implements ConfirmationStrategy {
  readonly mode = "ask_me" as const;

  evaluate(context: ConfirmationStrategyContext): ConfirmationStrategyResult {
    const pending = pendingEvents(context.events);
    if (pending.length === 0) {
      return { autoConfirmEventIds: [], reviewPrompt: null };
    }

    return {
      autoConfirmEventIds: [],
      reviewPrompt: {
        pendingEventIds: pending.map((event) => event.id),
        message: `${pending.length} expected payment${pending.length === 1 ? "" : "s"} require confirmation.`,
        options: ["mark_all_paid", "review_individually", "skip_for_now"]
      }
    };
  }
}

export class SmartAutoConfirmationStrategy implements ConfirmationStrategy {
  readonly mode = "smart_auto" as const;

  evaluate(context: ConfirmationStrategyContext): ConfirmationStrategyResult {
    const pending = pendingEvents(context.events);
    if (pending.length === 0) {
      return { autoConfirmEventIds: [], reviewPrompt: null };
    }

    const assessment = evaluateConfidence(context);

    if (isHighConfidence(assessment.score, context.smartAutoThreshold) && pending.length === 1) {
      return { autoConfirmEventIds: [pending[0]!.id], reviewPrompt: null };
    }

    if (isHighConfidence(assessment.score, context.smartAutoThreshold) && pending.length > 1) {
      return {
        autoConfirmEventIds: pending.map((event) => event.id),
        reviewPrompt: null
      };
    }

    return new AskConfirmationStrategy().evaluate(context);
  }
}

export class AlwaysAutoConfirmationStrategy implements ConfirmationStrategy {
  readonly mode = "always_auto" as const;

  evaluate(context: ConfirmationStrategyContext): ConfirmationStrategyResult {
    const pending = pendingEvents(context.events);
    return {
      autoConfirmEventIds: pending.map((event) => event.id),
      reviewPrompt: null
    };
  }
}

const STRATEGY_REGISTRY: Record<ConfirmationModeValue, ConfirmationStrategy> = {
  manual: new ManualConfirmationStrategy(),
  ask_me: new AskConfirmationStrategy(),
  smart_auto: new SmartAutoConfirmationStrategy(),
  always_auto: new AlwaysAutoConfirmationStrategy()
};

export function getConfirmationStrategy(mode: ConfirmationModeValue): ConfirmationStrategy {
  return STRATEGY_REGISTRY[mode];
}

export function runConfirmationEngine(
  context: ConfirmationStrategyContext
): ConfirmationStrategyResult {
  return getConfirmationStrategy(context.confirmationMode).evaluate(context);
}

export function registerConfirmationStrategy(
  mode: ConfirmationModeValue,
  strategy: ConfirmationStrategy
): void {
  STRATEGY_REGISTRY[mode] = strategy;
}
