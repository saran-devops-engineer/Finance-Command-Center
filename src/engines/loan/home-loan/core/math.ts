/** STEP 1 — Monthly interest rate: r = Annual / 12 / 100 */
export function monthlyInterestRate(annualInterestRate: number): number {
  return annualInterestRate / 12 / 100;
}

/** STEP 2 — EMI = P × r × (1+r)^n / ((1+r)^n − 1) */
export function calculateEmi(principal: number, annualInterestRate: number, tenureMonths: number): number {
  if (principal <= 0 || tenureMonths <= 0) {
    return 0;
  }

  const r = monthlyInterestRate(annualInterestRate);

  if (r <= 0) {
    return principal / tenureMonths;
  }

  const factor = Math.pow(1 + r, tenureMonths);
  return (principal * r * factor) / (factor - 1);
}

/**
 * STEP 3 — Reduce Tenure tenure formula (round UP):
 * n = ln(EMI / (EMI − P×r)) / ln(1+r)
 */
export function calculateTenureMonths(
  principal: number,
  annualInterestRate: number,
  emi: number
): number {
  if (principal <= 0) {
    return 0;
  }

  const r = monthlyInterestRate(annualInterestRate);

  if (r <= 0) {
    return Math.ceil(principal / emi);
  }

  if (emi <= principal * r) {
    return Number.POSITIVE_INFINITY;
  }

  const numerator = Math.log(emi / (emi - principal * r));
  const denominator = Math.log(1 + r);
  const tenure = numerator / denominator;

  return Number.isFinite(tenure) ? Math.ceil(tenure) : Number.POSITIVE_INFINITY;
}

/** Display rounding — currency to 2 decimal places */
export function roundCurrency(value: number): number {
  return Math.round(value * 100) / 100;
}

/** Display rounding — tenure whole months, always round UP */
export function roundTenureUp(value: number): number {
  return Math.ceil(value);
}
