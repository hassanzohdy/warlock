// import nodemon from "nodemon";
import { typecheckPlugin } from "@jgoz/esbuild-plugin-typecheck";
import { spawn } from "child_process";
import esbuild from "esbuild";
import { buildCliApp } from "../builder/build-cli-app";
import { srcPath, warlockPath } from "../utils";
import { nativeNodeModulesPlugin } from "./../esbuild";

export async function startCliServer() {
  // use esbuild to watch and rebuild the project

  const cliPath = await buildCliApp();

  await esbuild.build({
    platform: "node",
    entryPoints: [cliPath],
    bundle: true,
    minify: false,
    packages: "external",
    sourcemap: "linked",
    sourceRoot: srcPath(),
    // logLevel: "info",
    format: "cjs",
    target: ["esnext"],
    outdir: warlockPath(),
    plugins: [typecheckPlugin(), nativeNodeModulesPlugin],
  });

  const args = process.argv.slice(2);

  const processChild = spawn("node", [warlockPath("cli.js"), ...args], {
    stdio: "inherit",
  });

  processChild.on("exit", code => {
    if (code !== null) {
      process.exit(code);
    }
  });
}
