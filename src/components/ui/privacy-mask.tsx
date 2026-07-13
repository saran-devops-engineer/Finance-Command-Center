import type { ElementType, ReactNode } from "react";
import { clarityMaskProps } from "@/lib/privacy/clarity-mask";
import { cn } from "@/lib/utils";

interface PrivacyMaskProps {
  children: ReactNode;
  className?: string;
  as?: ElementType;
}

/**
 * Masks sensitive content from session recordings and heatmaps.
 * Use for financial amounts, summaries, and notes displayed in the UI.
 */
export function PrivacyMask({ children, className, as: Component = "span" }: PrivacyMaskProps) {
  return (
    <Component {...clarityMaskProps} className={cn(className)}>
      {children}
    </Component>
  );
}
