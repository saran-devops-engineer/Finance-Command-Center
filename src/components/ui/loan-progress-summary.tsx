import { PrivacyMask } from "@/components/ui/privacy-mask";
import { cn, formatInr } from "@/lib/utils";

export interface LoanProgressSummaryProps {
  principalPaid: number;
  originalAmount: number;
  className?: string;
}

function getPrincipalPaidPercent(principalPaid: number, originalAmount: number) {
  return Math.min(
    Math.round((principalPaid / Math.max(originalAmount, 1)) * 100),
    100
  );
}

export function LoanProgressSummary({
  principalPaid,
  originalAmount,
  className
}: LoanProgressSummaryProps) {
  const paidPercent = getPrincipalPaidPercent(principalPaid, originalAmount);

  return (
    <div className={cn("space-y-2", className)}>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-[width] duration-300"
          style={{ width: `${paidPercent}%` }}
        />
      </div>

      <div className="space-y-1">
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Principal paid
          </span>
          <span className="shrink-0 text-xs font-semibold tabular-nums leading-none text-foreground">
            {paidPercent}%
          </span>
        </div>

        <PrivacyMask
          as="p"
          className="min-w-0 whitespace-nowrap text-[clamp(0.5625rem,2.4vw,0.75rem)] font-semibold tabular-nums leading-none tracking-[-0.01em] text-foreground"
        >
          {formatInr(principalPaid)} of {formatInr(originalAmount)}
        </PrivacyMask>
      </div>
    </div>
  );
}
