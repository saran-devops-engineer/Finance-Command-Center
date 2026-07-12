import type { FinancialCommitment } from "@/engines/commitment/types";
import type { Chit } from "@/shared/domain/chit";
import type { Loan, MoneyBreakdown } from "@/shared/domain/finance";

export type FinancialInsightCategory = "savings" | "warning" | "opportunity" | "status";

export interface FinancialInsight {
  id: string;
  category: FinancialInsightCategory;
  message: string;
  actionLabel?: string;
  href?: string;
  priority: number;
}

export interface FinancialInsightContext {
  loans: Loan[];
  chits?: Chit[];
  moneyBreakdown: MoneyBreakdown;
  commitments: FinancialCommitment[];
  referenceDate?: string;
}

export interface FinancialInsightRule {
  id: string;
  evaluate(context: FinancialInsightContext): FinancialInsight | null;
}
