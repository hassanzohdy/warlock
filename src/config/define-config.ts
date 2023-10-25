import { merge } from "@mongez/reinforcements";
import { defaultWarlockConfigurations } from "./default-configurations";
import { ResolvedWarlockConfig, WarlockConfig } from "./types";

export function defineConfig(options: WarlockConfig) {
  return merge(defaultWarlockConfigurations, options) as ResolvedWarlockConfig;
}
