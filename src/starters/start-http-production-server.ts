import { spawn } from "child_process";
import path from "path";
import { getWarlockConfig } from "../config/get-warlock-config";

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

main();
