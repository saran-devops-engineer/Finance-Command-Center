/**
 * Registers the FCC service worker for PWA installability and offline support.
 * Skipped during `next dev` to avoid stale cache interfering with hot reload.
 */
export function registerServiceWorker() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return;
  }

  if (process.env.NODE_ENV === "development") {
    return;
  }

  window.addEventListener("load", () => {
    void navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .catch((error) => {
        console.error("[FCC] Service worker registration failed:", error);
      });
  });
}

/**
 * Returns true when the app is running in standalone (installed) mode.
 */
export function isStandaloneDisplayMode() {
  if (typeof window === "undefined") {
    return false;
  }

  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}
