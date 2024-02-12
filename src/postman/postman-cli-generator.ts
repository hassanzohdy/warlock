import {
  ensureDirectory,
  fileExists,
  listDirectories,
  putFile,
} from "@mongez/fs";
import { ltrim } from "@mongez/reinforcements";
import { spawn } from "child_process";
import esbuild from "esbuild";
import path from "path";
import { nativeNodeModulesPlugin } from "../esbuild";
import {
  configFileLoaderName,
  createConfigLoader,
} from "../loaders/create-essential-files";
import { appPath, srcPath, warlockPath } from "../utils";

async function main() {
  ensureDirectory(warlockPath());

  const directories = listDirectories(appPath());

  const routeFiles = directories
    .map(directoryPath => path.resolve(appPath(), directoryPath, "routes.ts"))
    .filter(filePath => fileExists(filePath))
    .map(file => ltrim(file.replace(srcPath(), "").replace(/\\/g, "/"), "/"));

  await createConfigLoader();

  let fileContents = "import { Postman } from '@mongez/warlock';\n";

  fileContents += `import "./${configFileLoaderName()}";\n`;

  routeFiles.forEach(file => {
    fileContents += `import "${file}";\n`;
  });

  fileContents += "new Postman().generate();\n";

  putFile(warlockPath("postman.ts"), fileContents);

  await esbuild.build({
    platform: "node",
    entryPoints: [warlockPath("postman.ts")],
    bundle: true,
    packages: "external",
    legalComments: "linked",
    target: ["esnext"],
    minify: false,
    sourcemap: "linked",
    sourceRoot: srcPath(),
    format: "cjs",
    outfile: path.resolve(warlockPath(), "__postman.js"),
    plugins: [nativeNodeModulesPlugin],
  });

  spawn("node", [path.resolve(warlockPath(), "__postman.js")], {
    stdio: "inherit",
    cwd: process.cwd(),
  });
}

main();
