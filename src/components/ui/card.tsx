import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { card, radius } from "@/lib/design-tokens";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <section
      className={cn(
        radius.card,
        card.padding,
        "border border-white/60 bg-card/72 shadow-card backdrop-blur",
        className
      )}
      {...props}
    />
  );
}
