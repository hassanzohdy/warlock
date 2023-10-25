import { putFile, unlink } from "@mongez/fs";
import esbuild from "esbuild";
import { pathToFileURL } from "url";

export async function executeTsFile(filePath: string) {
  const configPath = `./tmp.${Date.now()}.tmp.mjs`;

  const result = await esbuild.build({
    platform: "node",
    absWorkingDir: process.cwd(),
    entryPoints: [filePath],
    bundle: true,
    minify: false,
    write: false,
    packages: "external",
    format: "esm",
    target: ["node18"],
    sourcemap: "inline",
  });

  const fileUrl = `${pathToFileURL(configPath)}`;

  try {
    putFile(configPath, result.outputFiles[0].text);
    return await import(fileUrl);
  } finally {
    unlink(configPath);
  }
}
