import chalk from "chalk";
import { spawnSync } from "child_process";
import esbuild from "esbuild";
import path from "path";
import { getWarlockConfig } from "../config/get-warlock-config";
import { HttpLoader } from "../loaders/http-loader";
import { nativeNodeModulesPlugin } from "./esbuild/plugins";

export async function buildHttpForProduction() {
  const now = performance.now();
  console.log(chalk.cyan("Building HTTP server for production..."));

  console.log(chalk.yellow("Scanning project files..."));

  const httpLoader = new HttpLoader();
  const config = await getWarlockConfig();

  httpLoader.build();

  console.log(chalk.magenta("Bundling project files..."));

  spawnSync("tsc", ["--noEmit", "--color"], {
    stdio: "inherit",
  });

  await esbuild.build({
    platform: "node",
    entryPoints: [httpLoader.httpDevelopmentPath],
    bundle: true,
    packages: "external",
    minify: true,
    legalComments: "linked",
    target: ["esnext"],
    outfile: path.resolve(config.build.outputDir, config.build.entryFileName),
    plugins: [nativeNodeModulesPlugin],
  });

  console.log(
    chalk.green(
      `Project has been built in ${Math.floor(performance.now() - now)}ms`,
    ),
  );

  console.log(
    chalk.cyan('You can now run "warlock start" to start the server.'),
  );
}
