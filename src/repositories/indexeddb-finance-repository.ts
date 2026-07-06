import type { FinanceRepository } from "@/repositories/finance-repository";
import type {
  Loan,
  LoanPayment,
  MoneyBreakdown,
  UpcomingDue,
  UserProfile
} from "@/shared/domain/finance";
import { getFinanceDatabase } from "@/storage/indexeddb/database";

const MONEY_BREAKDOWN_ID = "current-month";
const PROFILE_ID = "primary";

export const indexedDbFinanceRepository: FinanceRepository = {
  async getProfile() {
    const database = await getFinanceDatabase();
    const profile = await database.get("profile", PROFILE_ID);
    return profile ?? null;
  },

  async saveProfile(value: UserProfile) {
    const database = await getFinanceDatabase();
    await database.put("profile", value);
  },

  async getMoneyBreakdown() {
    const database = await getFinanceDatabase();
    const record = await database.get("moneyBreakdown", MONEY_BREAKDOWN_ID);

    if (!record) {
      return null;
    }

    return {
      monthlyIncome: record.monthlyIncome,
      mandatoryExpenses: record.mandatoryExpenses,
      emis: record.emis,
      loanPayments: record.loanPayments,
      insurance: record.insurance,
      rent: record.rent,
      utilityBills: record.utilityBills,
      fixedCommitments: record.fixedCommitments,
      emergencyBuffer: record.emergencyBuffer
    };
  },

  async saveMoneyBreakdown(value: MoneyBreakdown) {
    const database = await getFinanceDatabase();
    await database.put("moneyBreakdown", {
      ...value,
      id: MONEY_BREAKDOWN_ID,
      updatedAt: new Date().toISOString()
    });
  },

  async listLoans() {
    const database = await getFinanceDatabase();
    return database.getAll("loans");
  },

  async getLoan(id: string) {
    const database = await getFinanceDatabase();
    const loan = await database.get("loans", id);
    return loan ?? null;
  },

  async saveLoan(value: Loan) {
    const database = await getFinanceDatabase();
    await database.put("loans", value);
  },

  async listLoanPayments(loanId: string) {
    const database = await getFinanceDatabase();
    return database.getAllFromIndex("loanPayments", "by-loan-id", loanId);
  },

  async saveLoanPayment(value: LoanPayment) {
    const database = await getFinanceDatabase();
    await database.put("loanPayments", value);
  },

  async listUpcomingDues() {
    const database = await getFinanceDatabase();
    return database.getAllFromIndex("upcomingDues", "by-due-date");
  },

  async saveUpcomingDue(value: UpcomingDue) {
    const database = await getFinanceDatabase();
    await database.put("upcomingDues", value);
  },

  async deleteUpcomingDue(id: string) {
    const database = await getFinanceDatabase();
    await database.delete("upcomingDues", id);
  }
};
