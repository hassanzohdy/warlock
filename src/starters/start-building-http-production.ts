import { Command } from "commander";
import { buildHttpForProduction } from "./build-http-production";

export function registerProductionBuildCommand() {
  return new Command("build").action(buildHttpForProduction);
}
