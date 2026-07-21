import { ProductCreationTypeId, type ProductCreationTypeIdValue } from "@/products/creation/types";
import { isGoldLoan } from "@/shared/finance/gold-loan-form";
import type { Loan } from "@/shared/domain/finance";

export function loanMatchesCreationType(
  loan: Loan,
  creationTypeId: ProductCreationTypeIdValue
): boolean {
  switch (creationTypeId) {
    case ProductCreationTypeId.HOME_LOAN:
      return loan.type === "home";
    case ProductCreationTypeId.GOLD_LOAN:
      return isGoldLoan(loan);
    case ProductCreationTypeId.PERSONAL_LOAN:
      return loan.type === "personal";
    case ProductCreationTypeId.VEHICLE_LOAN:
      return loan.type === "vehicle";
    case ProductCreationTypeId.EDUCATION_LOAN:
      return loan.type === "education";
    case ProductCreationTypeId.LAP:
      return loan.type === "custom" && loan.customTypeName === "Loan Against Property";
    case ProductCreationTypeId.BUSINESS_LOAN:
      return loan.type === "custom" && loan.customTypeName === "Business Loan";
    case ProductCreationTypeId.OTHER_LOAN:
      return loan.type === "other";
    default:
      return false;
  }
}
