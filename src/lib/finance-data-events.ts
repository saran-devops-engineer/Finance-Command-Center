export const FINANCE_DATA_UPDATED_EVENT = "fcc:finance-data-updated";

export type FinanceDataScope = "profile" | "loan" | "money" | "payment";

export function notifyFinanceDataUpdated(scope?: FinanceDataScope) {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(
    new CustomEvent(FINANCE_DATA_UPDATED_EVENT, {
      detail: { scope }
    })
  );
}

export function subscribeFinanceDataUpdated(listener: () => void) {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  window.addEventListener(FINANCE_DATA_UPDATED_EVENT, listener);

  return () => {
    window.removeEventListener(FINANCE_DATA_UPDATED_EVENT, listener);
  };
}
