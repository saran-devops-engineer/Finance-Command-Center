import { Suspense } from "react";
import { MobileShell } from "@/components/layout/mobile-shell";
import { ChitsScreen } from "@/features/chits/chits-screen";

export default function ChitsPage() {
  return (
    <MobileShell>
      <Suspense fallback={null}>
        <ChitsScreen />
      </Suspense>
    </MobileShell>
  );
}
