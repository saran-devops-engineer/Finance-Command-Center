import { PrivacyMask } from "@/components/ui/privacy-mask";
import { formatInr } from "@/lib/utils";

interface FinancialAmountProps {
  amount: number;
  compact?: boolean;
  className?: string;
}

export function FinancialAmount({ amount, compact = false, className }: FinancialAmountProps) {
  return (
    <PrivacyMask className={className}>
      {formatInr(amount, compact ? { compact: true } : undefined)}
    </PrivacyMask>
  );
}
