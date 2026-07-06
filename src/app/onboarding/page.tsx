import { MobileShell } from "@/components/layout/mobile-shell";
import { OnboardingScreen } from "@/features/onboarding/onboarding-screen";

export default function OnboardingPage() {
  return (
    <MobileShell showNavigation={false}>
      <OnboardingScreen />
    </MobileShell>
  );
}
