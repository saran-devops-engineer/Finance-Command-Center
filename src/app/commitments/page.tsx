import { Suspense } from "react";
import { MobileShell } from "@/components/layout/mobile-shell";
import { CommitmentsScreen } from "@/features/commitments/commitments-screen";

export default function CommitmentsPage() {
  return (
    <MobileShell>
      <Suspense fallback={null}>
        <CommitmentsScreen />
      </Suspense>
    </MobileShell>
  );
}
