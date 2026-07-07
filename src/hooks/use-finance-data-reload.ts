"use client";

import { useEffect, useRef } from "react";
import { subscribeFinanceDataUpdated } from "@/lib/finance-data-events";

export function useFinanceDataReload(reload: () => void) {
  const reloadRef = useRef(reload);

  useEffect(() => {
    reloadRef.current = reload;
  }, [reload]);

  useEffect(() => {
    return subscribeFinanceDataUpdated(() => {
      reloadRef.current();
    });
  }, []);
}
