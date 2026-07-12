import type { Chit, ChitStatus } from "@/shared/domain/chit";
import { applyChitDerivedFields } from "@/shared/finance/chit-calculations";

export function getChitStatus(chit: Chit): ChitStatus {
  return chit.status ?? "active";
}

export function isActiveChit(chit: Chit) {
  return getChitStatus(chit) === "active";
}

export function isArchivedChit(chit: Chit) {
  return getChitStatus(chit) === "archived";
}

export function normalizeChit(chit: Chit): Chit {
  return applyChitDerivedFields({
    ...chit,
    status: getChitStatus(chit)
  });
}

export function filterActiveChits(chits: Chit[]) {
  return chits.filter(isActiveChit);
}

export function filterArchivedChits(chits: Chit[]) {
  return chits.filter(isArchivedChit);
}
