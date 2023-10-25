import events from "@mongez/events";
import { ensureDirectory, putFile } from "@mongez/fs";
import { srcPath } from "@mongez/node";
import { rtrim, trim } from "@mongez/reinforcements";
import { warlockPath } from "../utils";

export class Loader {
  public constructor(protected paths: string[]) {
    //
    ensureDirectory(warlockPath());
  }

  /**
   * Load all files
   */
  public load() {
    //

    putFile(
      warlockPath("config-loader.ts"),
      `import loadConfigurations from "src/config";loadConfigurations();`,
    );

    putFile(
      warlockPath("http.ts"),
      `import './config-loader';\n` +
        this.paths
          .map(path => {
            path = rtrim(
              trim(path.replace(srcPath(), "").replace(/\\/g, "/"), "/"),
              ".ts",
            );

            if (path.includes("config")) {
              return `import loadConfigurations from "src/${path}";\nloadConfigurations();`;
            }

            return `import "src/${path}";`;
          })
          .join(""),
    );

    events.trigger("loader.loaded", this.paths);
  }
}
