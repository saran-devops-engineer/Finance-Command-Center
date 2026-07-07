import { MobileShell } from "@/components/layout/mobile-shell";
import { EditLoanScreen } from "@/features/loans/edit-loan-screen";

interface EditLoanPageProps {
  params: Promise<{
    loanId: string;
  }>;
}

export default async function EditLoanPage({ params }: EditLoanPageProps) {
  const { loanId } = await params;

  return (
    <MobileShell>
      <EditLoanScreen loanId={loanId} />
    </MobileShell>
  );
}
