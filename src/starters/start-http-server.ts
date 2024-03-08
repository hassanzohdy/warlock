// import nodemon from "nodemon";
import { typecheckPlugin } from "@jgoz/esbuild-plugin-typecheck";
import { getFile } from "@mongez/fs";
import { debounce } from "@mongez/reinforcements";
import chokidar from "chokidar";
import { Command } from "commander";
import esbuild from "esbuild";
import { buildHttpApp } from "../builder/build-http-app";
import { preloadCommand } from "../console";
import { rootPath, srcPath, warlockPath } from "../utils";
import { nativeNodeModulesPlugin, startServerPlugin } from "./../esbuild";

export async function startHttpApp() {
  // use esbuild to watch and rebuild the project

  const httpPath = await buildHttpApp();

  const builder = await esbuild.context({
    platform: "node",
    entryPoints: [httpPath],
    bundle: true,
    minify: false,
    packages: "external",
    sourcemap: "linked",
    sourceRoot: srcPath(),
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

  const watcher = chokidar.watch(
    [
      srcPath(),
      rootPath(".env"),
      rootPath(".env.local"),
      rootPath(".env.shared"),
      rootPath(".env.development"),
      rootPath(".production"),
      rootPath(".env.test"),
    ],
    {
      persistent: true,
      ignoreInitial: true,
    },
  );

  const cachedFiles = new Map<string, string>();

  builder.rebuild();
  watcher.on(
    "all",
    debounce(async (e, path) => {
      if (e === "addDir") return;

      if (e === "unlink") {
        cachedFiles.delete(path);

        await buildHttpApp();

        builder.rebuild();

        return;
      }

      const contents = getFile(path);

      if (cachedFiles.get(path) === contents) {
        return;
      }

      cachedFiles.set(path, contents);

      await buildHttpApp();

      builder.rebuild();
    }, 10),
  );
}

export function registerHttpDevelopmentServerCommand() {
  return preloadCommand(new Command("dev").action(startHttpApp), ["watch"]);
}
