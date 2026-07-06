import type { ReactNode } from "react";
import { BottomNavigation } from "./bottom-navigation";

interface MobileShellProps {
  children: ReactNode;
  showNavigation?: boolean;
}

export function MobileShell({ children, showNavigation = true }: MobileShellProps) {
  return (
    <main className="mx-auto min-h-dvh w-full max-w-md px-5 pt-8 safe-area-shell">
      {children}
      {showNavigation ? <BottomNavigation /> : null}
    </main>
  );
}
