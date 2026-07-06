import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <section
      className={cn(
        "rounded-[2rem] border border-white/60 bg-card/72 p-6 shadow-card backdrop-blur",
        className
      )}
      {...props}
    />
  );
}
