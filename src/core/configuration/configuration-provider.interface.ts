import type { AppConfiguration } from "@/core/configuration/types";

export interface ConfigurationProvider {
  getConfiguration(): AppConfiguration;
}
