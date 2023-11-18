// import nodemon from "nodemon";
import { typecheckPlugin } from "@jgoz/esbuild-plugin-typecheck";
import { getFile } from "@mongez/fs";
import { debounce } from "@mongez/reinforcements";
import chokidar from "chokidar";
import esbuild from "esbuild";
import { HttpLoader } from "../loaders/http-loader";
import { rootPath, srcPath, warlockPath } from "../utils";
import { nativeNodeModulesPlugin, startServerPlugin } from "./../esbuild";

export async function startHttpApp() {
  const httpLoader = new HttpLoader();
  await httpLoader.build();

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
    plugins: [typecheckPlugin(), nativeNodeModulesPlugin, startServerPlugin],
  });

  const watcher = chokidar.watch([srcPath(), rootPath(".env")], {
    persistent: true,
    ignoreInitial: true,
  });

  const cachedFiles = new Map<string, string>();

  builder.rebuild();
  watcher.on(
    "all",
    debounce(async (e, path) => {
      if (e === "addDir") return;

      if (e === "unlink") {
        cachedFiles.delete(path);

        await httpLoader.build();

        builder.rebuild();

        return;
      }

      const contents = getFile(path);

      if (cachedFiles.get(path) === contents) {
        return;
      }

      cachedFiles.set(path, contents);

      await httpLoader.build();

      builder.rebuild();
    }, 10),
  );

  // builder.watch();
}
