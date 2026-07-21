"use client";

import { cn } from "@/lib/utils";
import { radius } from "@/lib/design-tokens";
import {
  PRODUCT_CREATION_CATALOG,
  type ProductCreationTypeIdValue
} from "@/products/creation";
import {
  FINANCIAL_FAMILY_CATALOG,
  FINANCIAL_FAMILY_LABELS,
  type FinancialFamilyIdValue
} from "@/products/families";

interface ProductTypeSelectorProps {
  selectedTypeId: ProductCreationTypeIdValue | null;
  onSelect: (creationTypeId: ProductCreationTypeIdValue) => void;
  familyFilter?: FinancialFamilyIdValue | string | null;
  /** @deprecated Use familyFilter */
  groupFilter?: FinancialFamilyIdValue | string | null;
  disabled?: boolean;
}

const FAMILY_ORDER: FinancialFamilyIdValue[] = [
  "loans",
  "savings",
  "investments",
  "community-finance",
  "insurance"
];

export function ProductTypeSelector({
  selectedTypeId,
  onSelect,
  familyFilter = null,
  groupFilter = null,
  disabled = false
}: ProductTypeSelectorProps) {
  const activeFamilyFilter = (familyFilter ?? groupFilter) as FinancialFamilyIdValue | null;
  const families = FAMILY_ORDER.filter(
    (familyId) => !activeFamilyFilter || familyId === activeFamilyFilter
  );

  return (
    <div className="space-y-6">
      {families.map((familyId) => {
        const items = PRODUCT_CREATION_CATALOG.filter((entry) => entry.familyId === familyId);
        const familyMeta = FINANCIAL_FAMILY_CATALOG.find((entry) => entry.familyId === familyId);

        if (items.length === 0) {
          return null;
        }

        return (
          <section key={familyId} className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              {familyMeta?.label ?? FINANCIAL_FAMILY_LABELS[familyId]}
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              {items.map((item) => {
                const isComingSoon = item.availability === "coming-soon";
                const isSelected = selectedTypeId === item.creationTypeId;

                return (
                  <button
                    key={item.creationTypeId}
                    type="button"
                    disabled={disabled || isComingSoon}
                    aria-pressed={isSelected}
                    aria-disabled={isComingSoon}
                    onClick={() => onSelect(item.creationTypeId)}
                    className={cn(
                      "min-h-14 rounded-2xl border px-4 py-3 text-left transition",
                      isSelected
                        ? "border-primary bg-primary/5 text-foreground"
                        : "border-border bg-white/45 text-foreground",
                      isComingSoon && "cursor-not-allowed opacity-50",
                      !isComingSoon && !disabled && "hover:border-primary/40",
                      radius.inner
                    )}
                  >
                    <p className="font-medium">{item.label}</p>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                      {item.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
