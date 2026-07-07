import type { ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface ExpandableCardProps {
  title: string;
  description: string;
  actionLabel: string;
  icon: ReactNode;
  isExpanded: boolean;
  onExpandedChange: (isExpanded: boolean) => void;
  children: ReactNode;
}

export function ExpandableCard({
  title,
  description,
  actionLabel,
  icon,
  isExpanded,
  onExpandedChange,
  children
}: ExpandableCardProps) {
  return (
    <section className="overflow-hidden rounded-[2rem] border border-white/70 bg-card/80 shadow-card backdrop-blur">
      <button
        type="button"
        aria-expanded={isExpanded}
        onClick={() => onExpandedChange(!isExpanded)}
        className="flex w-full items-center gap-4 p-6 text-left outline-none transition hover:bg-white/35 focus-visible:ring-2 focus-visible:ring-primary/40 motion-reduce:transition-none"
      >
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white/60 text-primary">
          {icon}
        </span>
        <span className="min-w-0 flex-1 space-y-2">
          <span className="block font-display text-3xl leading-tight tracking-[-0.04em]">
            {title}
          </span>
          <span className="block text-sm leading-6 text-muted-foreground">
            {description}
          </span>
          {!isExpanded ? (
            <span className="inline-flex rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
              {actionLabel}
            </span>
          ) : null}
        </span>
        <ChevronDown
          className={cn(
            "h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-300 motion-reduce:transition-none",
            isExpanded && "rotate-180"
          )}
          aria-hidden="true"
        />
      </button>
      <div
        className={cn(
          "grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none",
          isExpanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        )}
      >
        <div className="min-h-0 overflow-hidden">
          <div className="space-y-5 border-t border-border/60 p-6 pt-5">{children}</div>
        </div>
      </div>
    </section>
  );
}
