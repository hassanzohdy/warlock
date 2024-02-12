import { ensureDirectory, putFile } from "@mongez/fs";
import esbuild from "esbuild";
import path from "path";
import { nativeNodeModulesPlugin } from "../esbuild";
import {
  configFileLoaderName,
  createConfigLoader,
} from "../loaders/create-essential-files";
import { srcPath, warlockPath } from "../utils";

export async function buildTestServer() {
  ensureDirectory(warlockPath());

  putFile(
    warlockPath("bootstrap.ts"),
    `import { bootstrap } from "@mongez/warlock";\n bootstrap();`,
  );

  await createConfigLoader();

  let fileContents =
    "import { startTestApplication } from '@mongez/warlock';\n";

  fileContents += `
  import "./bootstrap";
  import "./${configFileLoaderName()}";
    
startTestApplication();
  `;

  putFile(warlockPath("tests.ts"), fileContents);

  await esbuild.build({
    platform: "node",
    entryPoints: [warlockPath("tests.ts")],
    bundle: true,
    packages: "external",
    legalComments: "linked",
    target: ["esnext"],
    minify: false,
    sourcemap: "linked",
    sourceRoot: srcPath(),
    format: "cjs",
    outfile: path.resolve(warlockPath(), "__test.js"),
    plugins: [nativeNodeModulesPlugin],
  });
}
