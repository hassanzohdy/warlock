// import nodemon from "nodemon";
import { typecheckPlugin } from "@jgoz/esbuild-plugin-typecheck";
import { srcPath } from "@mongez/node";
import esbuild from "esbuild";
import { HttpLoader } from "../loaders/http-loader";
import { warlockPath } from "../utils";
import { nativeNodeModulesPlugin, startServerPlugin } from "./esbuild/plugins";

export async function startHttpApp() {
  const httpLoader = new HttpLoader();

  httpLoader.build();
  // watch for any changes in the src directory, .env and tsconfig.json
  // if any change happens, we will restart the child process
  // const watchList = ["src", ".env", "tsconfig.json"];

  // use esbuild to watch and rebuild the project

  const builder = await esbuild.context({
    platform: "node",
    entryPoints: [httpLoader.httpDevelopmentPath],
    bundle: true,
    minify: false,
    packages: "external",
    sourcemap: "linked",
    sourceRoot: srcPath(),
    // logLevel: "info",
    format: "cjs",
    target: ["esnext"],
    outdir: warlockPath(),
    plugins: [
      typecheckPlugin({
        watch: true,
      }),
      nativeNodeModulesPlugin,
      startServerPlugin,
    ],
  });

  builder.watch();
}
