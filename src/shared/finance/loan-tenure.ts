export function estimateRemainingMonths(params: {
  principal: number;
  monthlyRate: number;
  monthlyPayment: number;
  fallbackMonths: number;
}) {
  if (params.principal <= 0) {
    return 0;
  }

  if (params.monthlyPayment <= 0) {
    return params.fallbackMonths;
  }

  if (params.monthlyRate <= 0) {
    return Math.ceil(params.principal / params.monthlyPayment);
  }

  const monthlyInterest = params.principal * params.monthlyRate;

  if (params.monthlyPayment <= monthlyInterest) {
    return params.fallbackMonths;
  }

  const months =
    -Math.log(1 - (params.principal * params.monthlyRate) / params.monthlyPayment) /
    Math.log(1 + params.monthlyRate);

  return Number.isFinite(months) ? Math.ceil(months) : params.fallbackMonths;
}
