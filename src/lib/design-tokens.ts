/**
 * Design Baseline v1.0
 * Maps to docs/handbook/006-design-tokens.md and 008-spacing-layout-system.md
 */
export const radius = {
  card: "rounded-[28px]",
  inner: "rounded-[20px]",
  input: "rounded-[20px]",
  pill: "rounded-full"
} as const;

export const spacing = {
  screenX: "px-5",
  screenTop: "pt-6",
  page: "space-y-8",
  section: "space-y-3",
  cardStack: "gap-4",
  metricGrid: "gap-3"
} as const;

export const card = {
  padding: "p-6",
  paddingCompact: "p-5",
  paddingMetric: "p-[18px]",
  paddingRow: "p-5"
} as const;

export const metric = {
  height: "h-[110px]",
  labelHeight: "h-8",
  labelToValue: "mt-2"
} as const;

export const shell = {
  maxWidth: "max-w-[430px]"
} as const;
