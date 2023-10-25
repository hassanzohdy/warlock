import { typecheckPlugin } from "@jgoz/esbuild-plugin-typecheck";
import chalk from "chalk";
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

  esbuild.build({
    platform: "node",
    entryPoints: [httpLoader.httpDevelopmentPath],
    bundle: true,
    packages: "external",
    minify: true,
    legalComments: "linked",
    target: ["esnext"],
    outfile: path.resolve(config.build.outputDir, config.build.entryFileName),
    plugins: [typecheckPlugin(), nativeNodeModulesPlugin],
  });

  console.log(
    chalk.green(
      `HTTP server bundle has been built in ${performance.now() - now}ms`,
    ),
  );
}
