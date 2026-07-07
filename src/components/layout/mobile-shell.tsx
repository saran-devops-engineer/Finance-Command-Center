import type { ReactNode } from "react";
import { BottomNavigation } from "./bottom-navigation";
import { shell, spacing } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

interface MobileShellProps {
  children: ReactNode;
  showNavigation?: boolean;
}

export function MobileShell({ children, showNavigation = true }: MobileShellProps) {
  return (
    <main
      className={cn(
        "mx-auto min-h-dvh w-full safe-area-shell",
        shell.maxWidth,
        spacing.screenX,
        spacing.screenTop
      )}
    >
      {children}
      {showNavigation ? <BottomNavigation /> : null}
    </main>
  );
}
