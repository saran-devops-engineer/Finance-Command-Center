import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type {
  Loan,
  LoanPayment,
  MoneyBreakdown,
  UpcomingDue,
  UserProfile
} from "@/shared/domain/finance";
import type { UserAppState } from "@/repositories/app-settings";
import type { Chit } from "@/shared/domain/chit";
import type { IncomeProfile } from "@/shared/domain/income";
import type { CommitmentRecord } from "@/shared/domain/commitment-record";
import type { SchemaMeta } from "@/shared/domain/schema-version";
import { migrateLegacyHomeLoan } from "@/shared/finance/home-loan-form";
import { migrateGoldLoan } from "@/shared/finance/gold-loan-form";

interface FinanceCommandCenterDb extends DBSchema {
  profile: {
    key: string;
    value: UserProfile;
  };
  moneyBreakdown: {
    key: string;
    value: MoneyBreakdown & { id: string; updatedAt: string };
  };
  loans: {
    key: string;
    value: Loan;
    indexes: { "by-next-due-date": string };
  };
  loanPayments: {
    key: string;
    value: LoanPayment;
    indexes: { "by-loan-id": string; "by-paid-on": string };
  };
  upcomingDues: {
    key: string;
    value: UpcomingDue;
    indexes: { "by-due-date": string };
  };
  /** User/session state (pinned loan, backup timestamps). Not financial ledger data. */
  appState: {
    key: string;
    value: UserAppState;
  };
  /** Chit Management V1 — standalone chit product records. */
  chits: {
    key: string;
    value: Chit;
    indexes: { "by-next-due-date": string; "by-status": Chit["status"] };
  };
  /** V2 income profile (simple or advanced). */
  incomeProfile: {
    key: string;
    value: IncomeProfile & { id: string };
  };
  /** V2 commitment records (manual + legacy-migrated + product-generated). */
  commitments: {
    key: string;
    value: CommitmentRecord;
    indexes: {
      "by-next-due-date": string;
      "by-review-status": CommitmentRecord["reviewStatus"];
    };
  };
  /** Schema version metadata for V1→V2 migration tracking. */
  schemaMeta: {
    key: string;
    value: SchemaMeta;
  };
}

let databasePromise: Promise<IDBPDatabase<FinanceCommandCenterDb>> | null = null;

export type FinanceDatabase = IDBPDatabase<FinanceCommandCenterDb>;

export function getFinanceDatabase() {
  if (!databasePromise) {
    databasePromise = openDB<FinanceCommandCenterDb>("finance-command-center", 7, {
      upgrade: async (database, oldVersion, _newVersion, transaction) => {
        if (!database.objectStoreNames.contains("profile")) {
          database.createObjectStore("profile", { keyPath: "id" });
        }

        if (!database.objectStoreNames.contains("moneyBreakdown")) {
          database.createObjectStore("moneyBreakdown", { keyPath: "id" });
        }

        if (!database.objectStoreNames.contains("loans")) {
          const loans = database.createObjectStore("loans", { keyPath: "id" });
          loans.createIndex("by-next-due-date", "nextDueDate");
        }

        if (!database.objectStoreNames.contains("loanPayments")) {
          const loanPayments = database.createObjectStore("loanPayments", {
            keyPath: "id"
          });
          loanPayments.createIndex("by-loan-id", "loanId");
          loanPayments.createIndex("by-paid-on", "paidOn");
        }

        if (!database.objectStoreNames.contains("upcomingDues")) {
          const upcomingDues = database.createObjectStore("upcomingDues", {
            keyPath: "id"
          });
          upcomingDues.createIndex("by-due-date", "dueDate");
        }

        if (!database.objectStoreNames.contains("appState")) {
          database.createObjectStore("appState", { keyPath: "id" });
        }

        if (!database.objectStoreNames.contains("chits")) {
          const chits = database.createObjectStore("chits", { keyPath: "id" });
          chits.createIndex("by-next-due-date", "nextDueDate");
          chits.createIndex("by-status", "status");
        }

        if (!database.objectStoreNames.contains("incomeProfile")) {
          database.createObjectStore("incomeProfile", { keyPath: "id" });
        }

        if (!database.objectStoreNames.contains("commitments")) {
          const commitments = database.createObjectStore("commitments", { keyPath: "id" });
          commitments.createIndex("by-next-due-date", "nextDueDate");
          commitments.createIndex("by-review-status", "reviewStatus");
        }

        if (!database.objectStoreNames.contains("schemaMeta")) {
          database.createObjectStore("schemaMeta", { keyPath: "id" });
        }

        if (oldVersion < 3) {
          const loanStore = transaction.objectStore("loans");
          const loans = await loanStore.getAll();

          for (const loan of loans) {
            if (loan.type === "home") {
              await loanStore.put(migrateLegacyHomeLoan(loan));
            }
          }
        }

        if (oldVersion < 4) {
          const loanStore = transaction.objectStore("loans");
          const loans = await loanStore.getAll();

          for (const loan of loans) {
            if (loan.type === "gold") {
              await loanStore.put(migrateGoldLoan(loan));
            }
          }
        }
      }
    });
  }

  return databasePromise;
}

/** Test helper — reset singleton between Vitest cases. */
export function resetFinanceDatabaseForTests() {
  databasePromise = null;
}
