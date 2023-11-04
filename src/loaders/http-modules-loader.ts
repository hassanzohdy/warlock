import {
  directoryExists,
  fileExists,
  listDirectories,
  listFiles,
} from "@mongez/fs";
import path from "path";

export class HttpModulesLoader {
  /**
   * files paths that would be fetched from the each module
   */
  protected files: string[] = ["main.ts", "utils/locales.ts", "routes.ts"];

  /**
   * Constructor
   */
  public constructor(protected appPath: string) {
    //
  }

  /**
   * Fetch all needed files from the each module path
   */
  public fetch() {
    // fetch all modules directories from the modules path
    const directories = listDirectories(this.appPath);

    const pathsList: string[] = [];

    // check if the app directory has main.ts file
    // if so, then add it to the paths list
    const appMainPath = path.resolve(this.appPath, "main.ts");

    if (fileExists(appMainPath)) {
      pathsList.push(appMainPath);
    }

    for (const directory of directories) {
      // fetch all needed files from the module
      const paths = this.fetchModuleFiles(
        path.resolve(this.appPath, directory),
      );

      // merge all paths
      pathsList.push(...paths);
    }

    return pathsList;
  }

  /**
   * Fetch all needed files from the module
   */
  protected fetchModuleFiles(modulePath: string) {
    const paths: string[] = [];

    for (const file of this.files) {
      const filePath = path.resolve(modulePath, file);

      if (fileExists(filePath)) {
        paths.push(filePath);
      }
    }

    // check the events directory
    // if it contains the index.ts file
    // then add it
    // otherwise, add all files in the directory
    if (directoryExists(path.resolve(modulePath, "events"))) {
      const eventsIndexFile = path.resolve(modulePath, "events/index.ts");

      if (fileExists(eventsIndexFile)) {
        paths.push(eventsIndexFile);
      } else {
        // now fetch all files in the events directory
        const eventsFiles = listFiles(path.resolve(modulePath, "events"));

        for (const file of eventsFiles) {
          const eventFilePath = path.resolve(modulePath, "events", file);

          paths.push(eventFilePath);
        }
      }
    }

    return paths;
  }
}
