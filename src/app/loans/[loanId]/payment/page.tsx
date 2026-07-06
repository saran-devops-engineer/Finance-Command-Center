import { MobileShell } from "@/components/layout/mobile-shell";
import { LogPaymentScreen } from "@/features/loans/log-payment-screen";

interface LogPaymentPageProps {
  params: Promise<{
    loanId: string;
  }>;
}

export default async function LogPaymentPage({ params }: LogPaymentPageProps) {
  const { loanId } = await params;

  return (
    <MobileShell>
      <LogPaymentScreen loanId={loanId} />
    </MobileShell>
  );
}
