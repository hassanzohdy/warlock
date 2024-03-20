// import { typecheckPlugin } from "@jgoz/esbuild-plugin-typecheck";
import { fileExistsAsync } from "@mongez/fs";
import { spawn } from "child_process";
import esbuild from "esbuild";
import { srcPath, warlockPath } from "../utils";
import { nativeNodeModulesPlugin } from "./../esbuild";

export async function startCliServer() {
  // use esbuild to watch and rebuild the project
  const outputCliPath = warlockPath("cli.js");

  if (await fileExistsAsync(outputCliPath)) {
    return require(outputCliPath);
  }

  const { buildCliApp } = await import("../builder/build-cli-app");

  const cliPath = await buildCliApp();

  await esbuild.build({
    platform: "node",
    entryPoints: [cliPath],
    bundle: true,
    minify: false,
    packages: "external",
    sourcemap: "linked",
    sourceRoot: srcPath(),
    format: "cjs",
    target: ["esnext"],
    outfile: outputCliPath,
    // plugins: [typecheckPlugin(), nativeNodeModulesPlugin],
    plugins: [nativeNodeModulesPlugin],
  });

  const args = process.argv.slice(2);

  const processChild = spawn("node", [outputCliPath, ...args], {
    stdio: "inherit",
  });

  processChild.on("exit", code => {
    if (code !== null) {
      process.exit(code);
    }
  });
}
