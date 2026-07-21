import { VisibleDomain } from "@/shared/domain/visible-domains";
import type { VisibleDomainId } from "@/shared/domain/visible-domains";
import { ProductTypeId } from "@/shared/domain/product";
import type { ProductTypeIdValue } from "@/shared/domain/product";
import { buildProductDetailPath } from "@/products/types";
import { getProductRouteConfig } from "@/products/registry";
import {
  getLegacyProductDetailPath as getLegacyPath,
  getProductTypeListPath as getListPath
} from "@/products/paths";

/** Primary application routes — V2 domain navigation. */
export const AppRoute = {
  HOME: "/",
  PRODUCTS: "/products",
  COMMITMENTS: "/commitments",
  INSIGHTS: "/insights",
  PROFILE: "/profile",
  ONBOARDING: "/onboarding",

  /** Legacy routes — preserved for backward compatibility. */
  LOANS: "/loans",
  MONEY: "/money",
  CHITS: "/chits"
} as const;

export const BottomNavIcon = {
  HOME: "home",
  PRODUCTS: "products",
  COMMITMENTS: "commitments",
  INSIGHTS: "insights",
  PROFILE: "profile"
} as const;

export type BottomNavIconId = (typeof BottomNavIcon)[keyof typeof BottomNavIcon];

/** Configuration for a single bottom-navigation destination. */
export interface BottomNavItemConfig {
  href: string;
  /** Full domain name — page titles, screen readers, tooltips. */
  label: string;
  /** Compact tab-bar label sized for narrow viewports (320px+). */
  navLabel: string;
  domain: VisibleDomainId;
  icon: BottomNavIconId;
}

export const BOTTOM_NAV_ITEMS: readonly BottomNavItemConfig[] = [
  {
    href: AppRoute.HOME,
    label: "Home",
    navLabel: "Home",
    domain: VisibleDomain.HOME,
    icon: BottomNavIcon.HOME
  },
  {
    href: AppRoute.PRODUCTS,
    label: "Products",
    navLabel: "Products",
    domain: VisibleDomain.PRODUCTS,
    icon: BottomNavIcon.PRODUCTS
  },
  {
    href: AppRoute.COMMITMENTS,
    label: "Commitments",
    navLabel: "Due",
    domain: VisibleDomain.COMMITMENTS,
    icon: BottomNavIcon.COMMITMENTS
  },
  {
    href: AppRoute.INSIGHTS,
    label: "Insights",
    navLabel: "Insights",
    domain: VisibleDomain.INSIGHTS,
    icon: BottomNavIcon.INSIGHTS
  },
  {
    href: AppRoute.PROFILE,
    label: "Profile",
    navLabel: "Profile",
    domain: VisibleDomain.PROFILE,
    icon: BottomNavIcon.PROFILE
  }
] as const;

export function getProductTypeListPath(productTypeId: ProductTypeIdValue): string {
  return getListPath(productTypeId);
}

export function getProductDetailPath(productTypeId: ProductTypeIdValue, productId: string): string {
  const config = getProductRouteConfig(productTypeId);
  return buildProductDetailPath(config.detailPathTemplate, productId);
}

export function getLegacyProductDetailPath(
  productTypeId: ProductTypeIdValue,
  productId: string
): string | null {
  return getLegacyPath(productTypeId, productId);
}

/** Resolve which bottom-nav domain is active for a pathname. */
export function getActiveNavDomain(pathname: string): VisibleDomainId {
  if (pathname === AppRoute.HOME) {
    return VisibleDomain.HOME;
  }

  if (
    pathname.startsWith(AppRoute.PRODUCTS) ||
    pathname.startsWith(AppRoute.LOANS) ||
    pathname.startsWith(AppRoute.CHITS)
  ) {
    return VisibleDomain.PRODUCTS;
  }

  if (pathname.startsWith(AppRoute.COMMITMENTS) || pathname.startsWith(AppRoute.MONEY)) {
    return VisibleDomain.COMMITMENTS;
  }

  if (pathname.startsWith(AppRoute.INSIGHTS)) {
    return VisibleDomain.INSIGHTS;
  }

  if (pathname.startsWith(AppRoute.PROFILE)) {
    return VisibleDomain.PROFILE;
  }

  return VisibleDomain.HOME;
}

export function isBottomNavRoute(pathname: string): boolean {
  return BOTTOM_NAV_ITEMS.some((item) => item.href === pathname) || getActiveNavDomain(pathname) !== VisibleDomain.HOME && pathname.split("/").length <= 3;
}

/** Map URL segment to product type id. */
export function parseProductTypeFromPath(segment: string): ProductTypeIdValue | null {
  const normalized = segment as ProductTypeIdValue;
  if (Object.values(ProductTypeId).includes(normalized)) {
    return normalized;
  }

  return null;
}
