import { MobileShell } from "@/components/layout/mobile-shell";
import { LoanDetailScreen } from "@/features/loans/loan-detail-screen";

interface LoanDetailPageProps {
  params: Promise<{
    loanId: string;
  }>;
}

export default async function LoanDetailPage({ params }: LoanDetailPageProps) {
  const { loanId } = await params;

  return (
    <MobileShell>
      <LoanDetailScreen loanId={loanId} />
    </MobileShell>
  );
}
