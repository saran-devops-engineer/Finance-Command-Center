import type { FinanceRepository } from "@/repositories/finance-repository";
import type {
  FinanceDataSnapshot,
  Loan,
  LoanPayment,
  MoneyBreakdown,
  UpcomingDue,
  UserProfile
} from "@/shared/domain/finance";
import { getFinanceDatabase } from "@/storage/indexeddb/database";
import { filterActiveLoans, filterArchivedLoans, normalizeLoan } from "@/lib/loan-status";

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
    const loans = await database.getAll("loans");
    return filterActiveLoans(loans.map(normalizeLoan));
  },

  async listArchivedLoans() {
    const database = await getFinanceDatabase();
    const loans = await database.getAll("loans");
    return filterArchivedLoans(loans.map(normalizeLoan));
  },

  async getLoan(id: string) {
    const database = await getFinanceDatabase();
    const loan = await database.get("loans", id);
    return loan ? normalizeLoan(loan) : null;
  },

  async saveLoan(value: Loan) {
    const database = await getFinanceDatabase();
    await database.put("loans", normalizeLoan(value));
  },

  async softDeleteLoan(id: string) {
    const database = await getFinanceDatabase();
    const loan = await database.get("loans", id);

    if (!loan) {
      return;
    }

    await database.put(
      "loans",
      normalizeLoan({
        ...loan,
        status: "deleted",
        deletedAt: new Date().toISOString()
      })
    );
  },

  async archiveLoan(id: string, archiveReason?: string) {
    const database = await getFinanceDatabase();
    const loan = await database.get("loans", id);

    if (!loan) {
      return;
    }

    await database.put(
      "loans",
      normalizeLoan({
        ...loan,
        status: "archived",
        archivedAt: new Date().toISOString(),
        archiveReason: archiveReason?.trim() || undefined
      })
    );
  },

  async listAllLoanPayments() {
    const database = await getFinanceDatabase();
    return database.getAll("loanPayments");
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
  },

  async createDataSnapshot() {
    const database = await getFinanceDatabase();
    const [profile, moneyRecord, loans, loanPayments, upcomingDues] = await Promise.all([
      database.get("profile", PROFILE_ID),
      database.get("moneyBreakdown", MONEY_BREAKDOWN_ID),
      database.getAll("loans"),
      database.getAll("loanPayments"),
      database.getAllFromIndex("upcomingDues", "by-due-date")
    ]);
    const moneyBreakdown = moneyRecord
      ? {
          monthlyIncome: moneyRecord.monthlyIncome,
          mandatoryExpenses: moneyRecord.mandatoryExpenses,
          emis: moneyRecord.emis,
          loanPayments: moneyRecord.loanPayments,
          insurance: moneyRecord.insurance,
          rent: moneyRecord.rent,
          utilityBills: moneyRecord.utilityBills,
          fixedCommitments: moneyRecord.fixedCommitments,
          emergencyBuffer: moneyRecord.emergencyBuffer
        }
      : null;

    return {
      schemaVersion: 1,
      exportedAt: new Date().toISOString(),
      profile: profile ?? null,
      moneyBreakdown,
      loans,
      loanPayments,
      upcomingDues
    };
  },

  async replaceAllData(value: FinanceDataSnapshot) {
    const database = await getFinanceDatabase();
    const transaction = database.transaction(
      ["profile", "moneyBreakdown", "loans", "loanPayments", "upcomingDues"],
      "readwrite"
    );

    await Promise.all([
      transaction.objectStore("profile").clear(),
      transaction.objectStore("moneyBreakdown").clear(),
      transaction.objectStore("loans").clear(),
      transaction.objectStore("loanPayments").clear(),
      transaction.objectStore("upcomingDues").clear()
    ]);

    if (value.profile) {
      await transaction.objectStore("profile").put(value.profile);
    }

    if (value.moneyBreakdown) {
      await transaction.objectStore("moneyBreakdown").put({
        ...value.moneyBreakdown,
        id: MONEY_BREAKDOWN_ID,
        updatedAt: new Date().toISOString()
      });
    }

    await Promise.all([
      ...value.loans.map((loan) =>
        transaction.objectStore("loans").put(normalizeLoan(loan))
      ),
      ...value.loanPayments.map((payment) =>
        transaction.objectStore("loanPayments").put(payment)
      ),
      ...value.upcomingDues.map((due) => transaction.objectStore("upcomingDues").put(due))
    ]);

    await transaction.done;
  }
};
