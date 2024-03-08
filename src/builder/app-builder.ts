import { colors } from "@mongez/copper";
import { ensureDirectory, fileExistsAsync, putFile } from "@mongez/fs";
import { ConsoleLog } from "@mongez/logger";
import { ltrim, rtrim } from "@mongez/reinforcements";
import glob from "fast-glob";
import prettier from "prettier";
import { transpile } from "../esbuild/transpile";
import { appPath, srcPath, warlockPath } from "../utils";

const resolveWinPath = (path: string) => path.replace(/\\/g, "/");

export async function globModule(fileName: string) {
  fileName += ".ts";

  const pathPattern = resolveWinPath(appPath(`**/${fileName}`));

  const paths = await glob([pathPattern], {
    dot: false,
  });

  const resolvedAppPath = resolveWinPath(appPath());

  return paths.map(path => {
    return "app/" + rtrim(ltrim(path.replace(resolvedAppPath, ""), "/"), ".ts");
  });
}

export async function globModuleDirectoryPattern(pattern: string) {
  const pathPattern = resolveWinPath(appPath(`**/${pattern}`));

  const paths = await glob([pathPattern], {
    dot: false,
  });

  const resolvedAppPath = resolveWinPath(appPath());

  return paths.map(path => {
    return "app/" + rtrim(ltrim(path.replace(resolvedAppPath, ""), "/"), ".ts");
  });
}

export async function globModuleDirectory(directory: string) {
  return globModuleDirectoryPattern(`${directory}/*.ts`);
}

export function ensureWarlockPath() {
  ensureDirectory(warlockPath());
}

export async function createWarlockFile(filePath: string, content: string) {
  putFile(
    warlockPath(filePath),
    await prettier.format(content, {
      parser: "typescript",
    }),
  );
}

export function createAppBuilder() {
  const imports: string[] = [];
  const contents: string[] = [];

  const importsToString = () => {
    return imports.join("\n");
  };

  const contentsToString = () => {
    return "\n" + contents.join("\n");
  };

  const saveAs = async (fileName: string) => {
    fileName += ".ts";

    await createWarlockFile(fileName, importsToString() + contentsToString());
  };

  const transpileFile = async (fileName: string) => {
    await saveAs(fileName);

    return await transpile(warlockPath(fileName + ".ts"), fileName + ".js");
  };

  const execute = async (fileName: string) => {
    const file = await transpileFile(fileName);

    require(file);
  };

  return {
    addContent(content: string) {
      contents.push(content);
    },
    addImport(...importsList: string[]) {
      imports.push(...importsList);
    },
    async addImportPath(path: string) {
      if (!path.endsWith(".ts")) {
        path += ".ts";
      }

      if (await fileExistsAsync(srcPath(path))) {
        imports.push(`import "${rtrim(path, ".ts")}"`);
      }
    },
    saveAs,
    transpile: transpileFile,
    execute,
  };
}

export async function createBootstrapFile() {
  await createWarlockFile(
    "bootstrap.ts",
    `import { bootstrap } from "@mongez/warlock";\n bootstrap();`,
  );

  return "import './bootstrap'";
}

export async function createEnvironmentModeDisplayFile() {
  await createWarlockFile(
    "environment-mode.ts",
    `import { displayEnvironmentMode } from "@mongez/warlock";\n displayEnvironmentMode();`,
  );

  return "import './environment-mode'";
}

export async function loadMainFiles() {
  const { addImportPath, saveAs } = createAppBuilder();

  addImportPath(srcPath("main.ts"));

  const paths = await globModule("main");

  await Promise.all(paths.map(async path => await addImportPath(path)));

  await saveAs("main");

  return `import "./main"`;
}

export async function loadLocalesFiles() {
  const { addImportPath, saveAs } = createAppBuilder();

  const paths = await globModule("utils/locales");

  await Promise.all(paths.map(async path => await addImportPath(path)));

  await saveAs("locales");

  return `import "./locales"`;
}

export async function loadEventFiles() {
  const { addImportPath, saveAs } = createAppBuilder();

  const paths = await globModuleDirectory("events");

  const consoleLog = new ConsoleLog();

  // raise a warning if there is an index file inside the events directory
  for (const path of paths) {
    if (path.includes("index")) {
      consoleLog.log(
        "optimizer",
        "events",
        `${colors.gold(path)} found in the events directory, please remove it as it will be ignored in the next release of warlock`,
        "warn",
      );
    }
  }

  await Promise.all(paths.map(async path => await addImportPath(path)));

  await saveAs("events");

  return `import "./events"`;
}

export async function loadRoutesFiles() {
  const { addImportPath, saveAs } = createAppBuilder();

  const paths = await globModule("routes");

  await Promise.all(paths.map(async path => await addImportPath(path)));

  await saveAs("routes");

  return `import "./routes"`;
}
