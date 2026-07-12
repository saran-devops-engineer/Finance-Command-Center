import type { ErrorProvider, ErrorReport } from "@/core/error/error-provider.interface";

export function createConsoleErrorProvider(): ErrorProvider {
  return {
    log(report: ErrorReport) {
      const prefix = `[FCC:${report.severity}]`;

      if (report.error instanceof Error) {
        console.error(prefix, report.message, report.error, report.context);
        return;
      }

      console.error(prefix, report.message, report.error, report.context);
    },

    report(report: ErrorReport) {
      this.log(report);
    }
  };
}
