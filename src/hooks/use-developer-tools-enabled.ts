import { areDeveloperToolsEnabled } from "@/core/configuration/environment";

export function useDeveloperToolsEnabled(): boolean {
  return areDeveloperToolsEnabled();
}
