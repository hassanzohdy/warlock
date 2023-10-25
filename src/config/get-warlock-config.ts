import path from "path";
import { executeTsFile } from "./../starters/execute-ts-file";
import { ResolvedWarlockConfig } from "./types";

let configurations: ResolvedWarlockConfig | null = null;

export async function getWarlockConfig() {
  if (configurations) return configurations;

  configurations = (
    await executeTsFile(path.resolve(process.cwd(), "warlock.config.ts"))
  ).default;

  return configurations as ResolvedWarlockConfig;
}
