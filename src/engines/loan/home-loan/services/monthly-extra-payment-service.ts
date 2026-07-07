/**
 * Rule Set 02 service alias — matches approved banking rules naming.
 * Delegates to the monthly extra payment simulator (simulation only).
 */
export {
  MonthlyExtraPaymentSimulator as MonthlyExtraPaymentService,
  monthlyExtraPaymentSimulator as monthlyExtraPaymentService
} from "@/engines/loan/home-loan/simulators/monthly-extra-payment";
