export type ErrorSeverity = "debug" | "info" | "warning" | "error" | "fatal";

export interface ErrorContext {
  [key: string]: string | number | boolean | null | undefined;
}

export interface ErrorReport {
  message: string;
  severity: ErrorSeverity;
  error?: unknown;
  context?: ErrorContext;
}

export interface ErrorProvider {
  log(report: ErrorReport): void;
  report(report: ErrorReport): void;
}

export interface TransformedError {
  message: string;
  severity: ErrorSeverity;
  context?: ErrorContext;
}
