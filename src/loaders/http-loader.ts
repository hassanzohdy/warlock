import { fileExists, putFile } from "@mongez/fs";
import { srcPath } from "@mongez/node";
import { rtrim, trim } from "@mongez/reinforcements";
import path from "path";
import { createEssentialFiles } from "./../loaders/create-essential-files";
import { HttpModulesLoader } from "./../loaders/http-modules-loader";
import { warlockPath } from "./../utils";

export class HttpLoader {
  public paths: string[] = [];

  public httpDevelopmentPath = warlockPath("http.ts");

  public constructor() {
    this.init();
  }

  protected init() {
    createEssentialFiles();

    if (fileExists(srcPath("main.ts"))) {
      this.paths.push("src/main");
    }

    this.paths.push("./bootstrap", "./config-loader");

    this.paths.push(...this.fetchAppPaths());

    this.paths.push("./start-http-application");
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
    putFile(
      this.httpDevelopmentPath,
      this.paths.map(path => `import "${path}"`).join(";"),
    );
  }
}
