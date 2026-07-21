/**
 * FCC Event Taxonomy — Product creation framework events.
 */

export const ProductEvents = {
  FAMILY_OPENED: "FAMILY_OPENED",
  PRODUCT_TYPE_OPENED: "PRODUCT_TYPE_OPENED",
  PRODUCT_SELECTED: "PRODUCT_SELECTED",
  PRODUCT_UPDATED: "PRODUCT_UPDATED",
  PRODUCT_VALIDATION_FAILED: "PRODUCT_VALIDATION_FAILED",
  PRODUCT_CREATION_CANCELLED: "PRODUCT_CREATION_CANCELLED"
} as const;

export type ProductEventName = (typeof ProductEvents)[keyof typeof ProductEvents];

export type ProductEventPayloadMap = {
  FAMILY_OPENED: { family_id?: string };
  PRODUCT_TYPE_OPENED: { family_id?: string; product_type?: string };
  PRODUCT_SELECTED: { product_type?: string };
  PRODUCT_UPDATED: { product_type?: string; product_id?: string };
  PRODUCT_VALIDATION_FAILED: { product_type?: string };
  PRODUCT_CREATION_CANCELLED: { product_type?: string };
};
