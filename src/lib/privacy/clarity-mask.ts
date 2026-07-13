/**
 * Microsoft Clarity privacy masking attributes.
 * @see https://learn.microsoft.com/en-us/clarity/setup-and-installation/clarity-masking
 */
export const CLARITY_MASK_ATTRIBUTE = "data-clarity-mask";
export const CLARITY_MASK_VALUE = "true";

export const clarityMaskProps = {
  [CLARITY_MASK_ATTRIBUTE]: CLARITY_MASK_VALUE
} as const;
