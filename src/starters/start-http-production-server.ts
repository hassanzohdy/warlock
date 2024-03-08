import { spawn } from "child_process";
import { Command } from "commander";
import path from "path";
import { getWarlockConfig } from "../config/get-warlock-config";
import { preloadCommand } from "../console";

async function main() {
  const config = await getWarlockConfig();

  spawn(
    "node",
    [path.resolve(config.build.outDirectory, config.build.outFile)],
    {
      stdio: "inherit",
      cwd: process.cwd(),
      env: {
        ...process.env,
        NODE_ENV: "production",
      },
    },
  );
}

export function registerRunProductionServerCommand() {
  return preloadCommand(new Command("start").action(main), ["watch"]);
}
