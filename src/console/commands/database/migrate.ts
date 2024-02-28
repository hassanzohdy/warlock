import { listMigrations, migrate } from "@mongez/monpulse";
import { toSnakeCase } from "@mongez/reinforcements";
import { Command } from "commander";
import {
  createAppBuilder,
  globModuleDirectoryPattern,
} from "../../../builder/app-builder";
import { registerCommand } from "../../commander";

export async function loadMigrationsFiles() {
  const { addImport, addContent, saveAs } = createAppBuilder();

  addImport(
    'import { setMigrationsList, listMigrations, migrate } from "@mongez/monpulse"',
    'import { setupDatabase } from "@mongez/warlock"',
  );

  addContent(`
const migrationsList: any[] = [];

const addMigrations = (imports: any) => {
  for (const key in imports) {
    migrationsList.push(imports[key]);      
  }
}
`);

  const migrationsList = await globModuleDirectoryPattern("models/**/setup.ts");

  for (const path of migrationsList) {
    const pathList = path.split("/");
    pathList.pop();
    const modelFileName = pathList.pop() as string;

    pathList.pop();

    const moduleName = pathList.pop()!;

    const importName = toSnakeCase(moduleName + "-" + modelFileName);

    addImport(`import * as ${importName} from "${path}"`);

    addContent(`addMigrations(${importName});`);
  }

  addContent(`
  setMigrationsList(migrationsList);
  `);

  await saveAs("migrations");

  return `import "./migrations"`;
}

export function registerMigrationCommand() {
  return new Command("migrate")
    .description("Generate Database Migrations")
    .option("-f, --fresh", "Drop all migrations and generate fresh migrations")
    .option("-l, --list", "List all migrations")
    .action(async options => {
      if (options.list) {
        return listMigrations();
      }

      await migrate(options.fresh);

      console.log("Done");
    });
}

registerCommand(registerMigrationCommand());
