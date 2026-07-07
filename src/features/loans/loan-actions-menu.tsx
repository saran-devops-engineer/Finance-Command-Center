"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { Archive, MoreVertical, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { radius } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

interface LoanActionsMenuProps {
  loanId: string;
  loanName: string;
  onArchive: () => void;
  onDelete: () => void;
}

export function LoanActionsMenu({
  loanId,
  loanName,
  onArchive,
  onDelete
}: LoanActionsMenuProps) {
  const menuId = useId();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handlePointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    window.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div ref={containerRef} className="relative shrink-0">
      <Button
        type="button"
        variant="secondary"
        size="sm"
        className="h-11 w-11 px-0"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-controls={menuId}
        aria-label={`Actions for ${loanName}`}
        onClick={() => setIsOpen((current) => !current)}
      >
        <MoreVertical className="h-4 w-4" aria-hidden="true" />
      </Button>

      {isOpen ? (
        <div
          id={menuId}
          role="menu"
          aria-label={`${loanName} actions`}
          className={cn(
            "absolute right-0 top-[calc(100%+0.5rem)] z-20 min-w-[12rem] overflow-hidden border border-border/70 bg-card shadow-[0_18px_40px_rgba(0,0,0,0.12)]",
            radius.inner
          )}
        >
          <Link
            href={`/loans/${loanId}/edit`}
            role="menuitem"
            className="flex min-h-12 items-center gap-3 px-4 text-sm font-medium transition hover:bg-white/55"
            onClick={() => setIsOpen(false)}
          >
            <Pencil className="h-4 w-4" aria-hidden="true" />
            Edit loan
          </Link>
          <button
            type="button"
            role="menuitem"
            className="flex min-h-12 w-full items-center gap-3 px-4 text-left text-sm font-medium transition hover:bg-white/55"
            onClick={() => {
              setIsOpen(false);
              onArchive();
            }}
          >
            <Archive className="h-4 w-4" aria-hidden="true" />
            Archive loan
          </button>
          <button
            type="button"
            role="menuitem"
            className="flex min-h-12 w-full items-center gap-3 px-4 text-left text-sm font-medium text-destructive transition hover:bg-white/55"
            onClick={() => {
              setIsOpen(false);
              onDelete();
            }}
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
            Delete loan
          </button>
        </div>
      ) : null}
    </div>
  );
}
