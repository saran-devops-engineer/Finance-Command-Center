import type {
  ErrorContext,
  ErrorProvider,
  ErrorReport,
  ErrorSeverity,
  TransformedError
} from "@/core/error/error-provider.interface";

function normalizeError(error: unknown, fallbackMessage: string): TransformedError {
  if (error instanceof Error) {
    return {
      message: error.message || fallbackMessage,
      severity: "error"
    };
  }

  if (typeof error === "string") {
    return {
      message: error,
      severity: "error"
    };
  }

  return {
    message: fallbackMessage,
    severity: "error"
  };
}

export class ErrorService {
  constructor(private readonly provider: ErrorProvider) {}

  log(message: string, context?: ErrorContext, severity: ErrorSeverity = "info") {
    this.provider.log({ message, severity, context });
  }

  report(error: unknown, context?: ErrorContext, severity: ErrorSeverity = "error") {
    const transformed = this.transform(error, context, severity);
    this.provider.report({
      message: transformed.message,
      severity: transformed.severity,
      error,
      context: transformed.context
    });
  }

  transform(
    error: unknown,
    context?: ErrorContext,
    severity: ErrorSeverity = "error"
  ): TransformedError {
    const normalized = normalizeError(error, "An unexpected error occurred.");

    return {
      message: normalized.message,
      severity,
      context
    };
  }
}

export function createErrorService(provider: ErrorProvider) {
  return new ErrorService(provider);
}
