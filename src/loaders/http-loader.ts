import { fileExists, putFileAsync } from "@mongez/fs";
import { rtrim, trim } from "@mongez/reinforcements";
import path from "path";
import { srcPath, warlockPath } from "../utils";
import { createEssentialFiles } from "./../loaders/create-essential-files";
import { HttpModulesLoader } from "./../loaders/http-modules-loader";

export class HttpLoader {
  public paths: string[] = [];

  public httpDevelopmentPath = warlockPath("http.ts");

  public async init() {
    this.paths = [];

    await createEssentialFiles();

    if (fileExists(srcPath("main.ts"))) {
      this.paths.push("src/main");
    }

    this.paths.push("./bootstrap", "./config-loader");

    this.paths.push(...this.fetchAppPaths());

    this.paths.push("./start-http-application");

    return this;
  }

  protected fetchAppPaths() {
    const appLoader = new HttpModulesLoader(
      path.resolve(process.cwd(), "src/app"),
    );

    const paths = appLoader.fetch();

    return paths.map(path => {
      path = rtrim(
        trim(path.replace(srcPath(), "").replace(/\\/g, "/"), "/"),
        ".ts",
      );

      return `src/${path}`;
    });
  }

  public async build() {
    await this.init();

    await putFileAsync(
      this.httpDevelopmentPath,
      this.paths.map(path => `import "${path}"`).join(";"),
    );
  }
}
