import type { HomeLoanEnginePhase } from "@/engines/loan/home-loan/types/LoanTypes";
import type {
  HomeLoanAnalysisRequest,
  HomeLoanAnalysisResult,
  HomeLoanSnapshot,
  PaymentApplicationRequest,
  PaymentApplicationResult,
  SimulationResult
} from "@/engines/loan/home-loan/types/LoanInterfaces";

/** Base event envelope for engine observability and future audit trails. */
export interface HomeLoanEngineEventBase {
  type: string;
  loanId: string;
  occurredAt: string;
  phase: HomeLoanEnginePhase;
}

export interface HomeLoanValidationCompletedEvent extends HomeLoanEngineEventBase {
  type: "home-loan.validation.completed";
  valid: boolean;
  errorCount: number;
  warningCount: number;
}

export interface HomeLoanSimulationCompletedEvent extends HomeLoanEngineEventBase {
  type: "home-loan.simulation.completed";
  scenarioKind: string;
  result: SimulationResult;
}

export interface HomeLoanPaymentProcessedEvent extends HomeLoanEngineEventBase {
  type: "home-loan.payment.processed";
  request: PaymentApplicationRequest;
  result: PaymentApplicationResult;
}

export interface HomeLoanAnalysisCompletedEvent extends HomeLoanEngineEventBase {
  type: "home-loan.analysis.completed";
  request: HomeLoanAnalysisRequest;
  result: HomeLoanAnalysisResult;
}

export interface HomeLoanEngineErrorEvent extends HomeLoanEngineEventBase {
  type: "home-loan.engine.error";
  message: string;
  cause?: unknown;
}

export type HomeLoanEngineEvent =
  | HomeLoanValidationCompletedEvent
  | HomeLoanSimulationCompletedEvent
  | HomeLoanPaymentProcessedEvent
  | HomeLoanAnalysisCompletedEvent
  | HomeLoanEngineErrorEvent;

export type HomeLoanEngineEventListener = (event: HomeLoanEngineEvent) => void;

/** Optional hook for logging, analytics, or future undo/replay systems. */
export interface HomeLoanEventBus {
  publish(event: HomeLoanEngineEvent): void;
  subscribe(listener: HomeLoanEngineEventListener): () => void;
}

/** Factory placeholder — implementation TBD. */
export interface HomeLoanEventFactory {
  validationCompleted(
    loan: HomeLoanSnapshot,
    valid: boolean,
    errorCount: number,
    warningCount: number
  ): HomeLoanValidationCompletedEvent;
}
