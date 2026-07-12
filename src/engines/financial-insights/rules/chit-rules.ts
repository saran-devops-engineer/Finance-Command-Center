import { deriveChitMetrics } from "@/shared/finance/chit-calculations";
import type { FinancialInsightRule } from "@/engines/financial-insights/types";

export const chitActiveInsightRule: FinancialInsightRule = {
  id: "chit-active",

  evaluate({ chits = [] }) {
    const activeChit = chits.find((chit) => chit.status === "active" && !chit.prizeReceived);

    if (!activeChit) {
      return null;
    }

    const metrics = deriveChitMetrics(activeChit);

    return {
      id: `insight-chit-active-${activeChit.id}`,
      category: "status",
      message: `Your chit is active. Remaining contributions: ${metrics.remainingContributions} months.`,
      actionLabel: "Open Chit",
      href: `/chits/${activeChit.id}`,
      priority: 45
    };
  }
};

export const chitPrizeReceivedInsightRule: FinancialInsightRule = {
  id: "chit-prize-received",

  evaluate({ chits = [] }) {
    const chit = chits.find((entry) => entry.status === "active" && entry.prizeReceived);

    if (!chit) {
      return null;
    }

    return {
      id: `insight-chit-prize-${chit.id}`,
      category: "status",
      message: "Continue paying remaining installments until completion.",
      actionLabel: "Open Chit",
      href: `/chits/${chit.id}`,
      priority: 46
    };
  }
};

export const chitNearingCompletionInsightRule: FinancialInsightRule = {
  id: "chit-nearing-completion",

  evaluate({ chits = [] }) {
    const chit = chits
      .filter((entry) => entry.status === "active")
      .find((entry) => {
        const metrics = deriveChitMetrics(entry);
        return metrics.remainingMonths > 0 && metrics.remainingMonths <= 3;
      });

    if (!chit) {
      return null;
    }

    return {
      id: `insight-chit-completion-${chit.id}`,
      category: "status",
      message: "Your chit is nearing completion.",
      actionLabel: "Open Chit",
      href: `/chits/${chit.id}`,
      priority: 15
    };
  }
};
