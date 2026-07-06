import { MobileShell } from "@/components/layout/mobile-shell";
import { HomeScreen } from "@/features/home/home-screen";

export default function HomePage() {
  return (
    <MobileShell>
      <HomeScreen />
    </MobileShell>
  );
}
