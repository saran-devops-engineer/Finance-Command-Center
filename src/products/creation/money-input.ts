import { toNumber } from "@/shared/finance/loan-form";

/** Strip formatting and parse a money field value. */
export function parseMoneyInput(value: string): number {
  return toNumber(value);
}

/** Format digits with Indian grouping while typing. Preserves decimal segment. */
export function formatMoneyInput(raw: string): string {
  const cleaned = raw.replace(/[^\d.]/g, "");
  if (!cleaned) {
    return "";
  }

  const [wholePart, ...decimalParts] = cleaned.split(".");
  const decimal = decimalParts.length > 0 ? `.${decimalParts.join("").slice(0, 2)}` : "";
  const digits = wholePart.replace(/^0+(?=\d)/, "") || "0";
  const grouped = digits.replace(/\B(?=(\d{3})+(?!\d))/g, ",");

  return `${grouped}${decimal}`;
}
