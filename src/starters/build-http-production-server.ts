import { typecheckPlugin } from "@jgoz/esbuild-plugin-typecheck";
import esbuild from "esbuild";
import path from "path";
import { getWarlockConfig } from "../config/get-warlock-config";
import { HttpLoader } from "../loaders/http-loader";
import { nativeNodeModulesPlugin } from "./esbuild/plugins";

export async function buildHttpForProductionSever() {
  const httpLoader = new HttpLoader();
  const config = await getWarlockConfig();

  httpLoader.build();

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
}
