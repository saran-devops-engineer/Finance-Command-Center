/**
 * PWA platform detection for install welcome flow.
 */

export function isIosDevice() {
  if (typeof window === "undefined") {
    return false;
  }

  const userAgent = window.navigator.userAgent;
  const isClassicIos = /iPad|iPhone|iPod/.test(userAgent);
  const isIpadOs =
    window.navigator.platform === "MacIntel" && window.navigator.maxTouchPoints > 1;

  return isClassicIos || isIpadOs;
}

export function isAndroidDevice() {
  if (typeof window === "undefined") {
    return false;
  }

  return /Android/.test(window.navigator.userAgent);
}
