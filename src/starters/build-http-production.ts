import { colors } from "@mongez/copper";
import { spawnSync } from "child_process";
import esbuild from "esbuild";
import path from "path";
import { getWarlockConfig } from "../config/get-warlock-config";
import { HttpLoader } from "../loaders/http-loader";
import { nativeNodeModulesPlugin } from "./../esbuild";

export async function buildHttpForProduction() {
  const now = performance.now();
  console.log(colors.cyan("Building HTTP server for production..."));

  console.log(colors.yellow("Scanning project files..."));

  const httpLoader = new HttpLoader();
  const config = await getWarlockConfig();

  httpLoader.build();

  console.log(colors.magenta("Bundling project files..."));

  spawnSync("tsc", ["--noEmit"], {
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
    colors.green(
      `Project has been built in ${Math.floor(performance.now() - now)}ms`,
    ),
  );

  console.log(
    colors.cyan('You can now run "warlock start" to start the server.'),
  );
}
