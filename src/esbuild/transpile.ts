// import nodemon from "nodemon";
import esbuild from "esbuild";
import { srcPath, warlockPath } from "../utils";
import { nativeNodeModulesPlugin } from "./../esbuild";

export async function transpile(file: string, exportAs: string) {
  const outfile = warlockPath(exportAs);
  await esbuild.build({
    platform: "node",
    entryPoints: [file],
    bundle: true,
    minify: true,
    packages: "external",
    outfile,
    sourcemap: "linked",
    sourceRoot: srcPath(),
    format: "cjs",
    target: ["esnext"],
    plugins: [nativeNodeModulesPlugin],
  });

  return outfile;
}
