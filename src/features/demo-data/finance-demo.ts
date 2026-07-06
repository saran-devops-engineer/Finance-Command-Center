import type { Loan, MoneyBreakdown, UpcomingDue } from "@/shared/domain/finance";

export const demoMoneyBreakdown: MoneyBreakdown = {
  monthlyIncome: 285000,
  mandatoryExpenses: 42000,
  emis: 18600,
  loanPayments: 86400,
  insurance: 12800,
  rent: 0,
  utilityBills: 6400,
  fixedCommitments: 21500,
  emergencyBuffer: 240000
};

export const demoLoans: Loan[] = [
  {
    id: "bajaj-personal",
    name: "Bajaj Personal Loan",
    type: "personal",
    lender: "Bajaj Finserv",
    originalAmount: 500000,
    outstandingBalance: 189500,
    annualInterestRate: 13.9,
    monthlyEmi: 12400,
    principalPaid: 310500,
    interestPaid: 73500,
    remainingTenureMonths: 18,
    estimatedClosureDate: "2028-10-01",
    nextDueDate: "2028-03-22"
  },
  {
    id: "muthoot-gold",
    name: "Muthoot Gold Loan",
    type: "gold",
    lender: "Muthoot Finance",
    originalAmount: 280000,
    outstandingBalance: 208000,
    annualInterestRate: 11.5,
    monthlyEmi: 6400,
    principalPaid: 72000,
    interestPaid: 28200,
    remainingTenureMonths: 36,
    estimatedClosureDate: "2029-09-01",
    nextDueDate: "2028-03-18"
  },
  {
    id: "hdfc-home",
    name: "HDFC Home Loan",
    type: "home",
    lender: "HDFC Bank",
    originalAmount: 4200000,
    outstandingBalance: 3820000,
    annualInterestRate: 8.6,
    monthlyEmi: 45200,
    principalPaid: 380000,
    interestPaid: 620000,
    remainingTenureMonths: 214,
    estimatedClosureDate: "2045-12-01",
    nextDueDate: "2028-03-05"
  }
];

export const demoUpcomingDues: UpcomingDue[] = [
  {
    id: "hdfc-home-emi",
    title: "HDFC Home EMI",
    dueDate: "2028-03-05",
    amount: 45200,
    source: "loan"
  },
  {
    id: "tata-aig-health",
    title: "Tata AIG Health",
    dueDate: "2028-03-13",
    amount: 12800,
    source: "insurance"
  },
  {
    id: "muthoot-gold-emi",
    title: "Muthoot Gold EMI",
    dueDate: "2028-03-18",
    amount: 6400,
    source: "loan"
  }
];
