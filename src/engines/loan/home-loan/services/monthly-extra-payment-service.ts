/**
 * Rule Set 02 service alias — delegates to HomeLoanAmortizationEngine.
 */
export {
  homeLoanAmortizationEngine as MonthlyExtraPaymentService,
  homeLoanAmortizationEngine as monthlyExtraPaymentService
} from "@/engines/loan/home-loan/HomeLoanAmortizationEngine";
