import { getFileAsync } from "@mongez/fs";
import { toSnakeCase } from "@mongez/reinforcements";
import { loadMigrationsFiles } from "../console/commands/database/migrate";
import { srcPath, warlockPath } from "../utils/paths";
import {
  createAppBuilder,
  createBootstrapFile,
  globModuleDirectory,
  loadEventFiles,
} from "./app-builder";
import { createConfigLoader } from "./config-loader-builder";

export async function buildCliApp() {
  const { addImport, saveAs } = createAppBuilder();

  const data = await Promise.all([
    createBootstrapFile(),
    createConfigLoader(),
    loadEventFiles(),
    loadCommandFiles(),
    loadMigrationsFiles(),
    createCliApplicationStarter(),
  ]);

  addImport(...data);

  await saveAs("cli");

  return warlockPath("cli.ts");
}

export async function createCliApplicationStarter() {
  const { addImport, addContent, saveAs } = createAppBuilder();

  addImport(`import { startConsoleApplication } from "@mongez/warlock"`);

  addContent(`startConsoleApplication();`);

  await saveAs("start-console-application");

  return `import "./start-console-application"`;
}

export async function loadCommandFiles() {
  const { addImport, addContent, saveAs } = createAppBuilder();

  const paths = await globModuleDirectory("commands");

  addImport(`import { colors } from "@mongez/copper";`);
  addImport(`import { Command } from "commander";`);
  addImport(`import {registerCommand } from "@mongez/warlock"`);

  const createCommandFrom = async (moduleCommandName: string, path: string) => {
    const fileContents = await getFileAsync(srcPath(path + ".ts"));

    const hasDescription = fileContents.includes("export const description");

    const description = hasDescription
      ? `      
    const description_${moduleCommandName} = ${moduleCommandName}.description;
    command_${moduleCommandName}.description(description_${moduleCommandName});
      `
      : "";

    const hasOptions = fileContents.includes("export const options");

    const options = hasOptions
      ? `
      const options_${moduleCommandName}: (string | string[])[] = ${moduleCommandName}.options || [];

      for (let option of options_${moduleCommandName}) {
        if (! Array.isArray(option)) {
          option = [option];
        }

        command_${moduleCommandName}.option(...option);
      }
      `
      : "";

    const content = `

    // ${path}
    const commandName_${moduleCommandName} = ${moduleCommandName}.name;

    const action_${moduleCommandName} = ${moduleCommandName}.action;

    if (! commandName_${moduleCommandName}) {
      throw new Error(\`Command name is missing in \${colors.yellow("${path}")}\`);
    }
    
    if (! action_${moduleCommandName}) {
      throw new Error(\`Command action is missing in \${colors.yellow("${path}")}\`);
    }

    const command_${moduleCommandName} = new Command(commandName_${moduleCommandName}).action(action_${moduleCommandName});

    ${description}

    ${options}

    registerCommand(command_${moduleCommandName});
    `;

    addContent(content);
  };

  const addCliImport = async (path: string) => {
    // we need first to get the module name then the command name
    const pathList = path.split("/");
    const commandFileName = pathList.pop() as string;

    pathList.pop();

    const moduleName = pathList.pop()!;

    const commandImportName = toSnakeCase(moduleName + "-" + commandFileName);

    await createCommandFrom(commandImportName, path);

    return addImport(`import * as ${commandImportName} from "${path}";`);
  };

  await Promise.all(paths.map(async path => await addCliImport(path)));

  await saveAs("commands");

  return `import "./commands"`;
}
