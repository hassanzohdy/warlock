import glob from "fast-glob";
import path from "path";
import { appPath } from "../utils";

export async function collectRoutesFromFiles() {
  const routesFiles = await glob(
    path.resolve(appPath()).replace(/\\/g, "/") + "/**/routes.ts",
  );

  const importedFiles: any[] = [];

  console.log("Route Files", routesFiles.length);

  for (const file of routesFiles) {
    importedFiles.push(
      import(
        /* Add magic comment for webpack to recognize the file in build */
        /* webpackInclude: /\.ts$/ */
        file
      ),
    );
  }

  await Promise.all(importedFiles);

  console.log("Loadded", importedFiles.length, "files");
}
