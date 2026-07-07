import { Suspense } from "react";
import { MobileShell } from "@/components/layout/mobile-shell";
import { LoansScreen } from "@/features/loans/loans-screen";

export default function LoansPage() {
  return (
    <MobileShell>
      <Suspense fallback={null}>
        <LoansScreen />
      </Suspense>
    </MobileShell>
  );
}
