import type {
  FinancialSnapshot,
  Loan,
  MoneyBreakdown,
  UpcomingDue
} from "@/shared/domain/finance";
import { generateRecommendations } from "@/services/recommendation-engine/rules";
import { assessFinancialHealth } from "./health-assessment";

interface SnapshotInput {
  money: MoneyBreakdown;
  loans: Loan[];
  upcomingDues: UpcomingDue[];
}

export function createFinancialSnapshot(input: SnapshotInput): FinancialSnapshot {
  const assessment = assessFinancialHealth({
    money: input.money,
    upcomingDues: input.upcomingDues
  });

  return {
    healthStatus: assessment.status,
    healthReason: assessment.reason,
    availableMoney: assessment.availableMoney,
    mandatoryCommitments: assessment.mandatoryCommitments,
    debtToIncomeRatio: assessment.debtToIncomeRatio,
    upcomingDues: input.upcomingDues,
    recommendations: generateRecommendations(input)
  };
}
