import { MobileShell } from "@/components/layout/mobile-shell";
import { AddChitScreen } from "@/features/chits/add-chit-screen";

export default function NewChitPage() {
  return (
    <MobileShell>
      <AddChitScreen />
    </MobileShell>
  );
}
