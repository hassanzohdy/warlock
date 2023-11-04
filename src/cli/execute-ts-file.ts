/* eslint-disable @typescript-eslint/no-var-requires */
import { ensureDirectory, putFile, unlink } from "@mongez/fs";
import esbuild from "esbuild";
import { warlockPath } from "../utils";

export async function executeTsFile(filePath: string) {
  ensureDirectory(warlockPath());
  const tempFilePath = warlockPath(`warlock.${Date.now()}.tmp.js`);

  const result = await esbuild.build({
    platform: "node",
    absWorkingDir: process.cwd(),
    entryPoints: [filePath],
    bundle: true,
    minify: false,
    write: false,
    packages: "external",
    format: "cjs",
    target: ["node18"],
    sourcemap: "inline",
  });

  try {
    putFile(tempFilePath, result.outputFiles[0].text);
    const output = require(tempFilePath);
    unlink(tempFilePath);

    return output;
  } finally {
    //
  }
}
