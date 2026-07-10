import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type {
  Loan,
  LoanPayment,
  MoneyBreakdown,
  UpcomingDue,
  UserProfile
} from "@/shared/domain/finance";
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
}

let databasePromise: Promise<IDBPDatabase<FinanceCommandCenterDb>> | null = null;

export function getFinanceDatabase() {
  if (!databasePromise) {
    databasePromise = openDB<FinanceCommandCenterDb>("finance-command-center", 4, {
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
