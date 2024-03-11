import { ltrim } from "@mongez/reinforcements";
import { Command } from "commander";
import {
  createAppBuilder,
  globModuleDirectoryPattern,
} from "../../../builder/app-builder";
import { preloadCommand } from "../../commander";
import { srcPath } from "./../../../utils/paths";
import { startSeeding } from "./seeder";

export function registerDatabaseSeedsCommand() {
  return preloadCommand(
    new Command("seed")
      .option(
        "--once",
        "If set, the seed will be run only for one time even you run this command multiple times.",
      )
      .option("--fresh", "Clear the previous seeds and run it again.")
      .description(
        "Run database seeds for all modules, make sure each seeds are in `seeds` directory in any module in `src/app` that you want to run seeds for it. ",
      )
      .action(async options => {
        await startSeeding({
          fresh: options.fresh,
          once: options.once,
        });
      }),
    ["database"],
  );
}

export async function loadSeedsFiles() {
  const { addImport, saveAs } = createAppBuilder();

  const seedsList = await globModuleDirectoryPattern("seeds/*");

  for (const path of seedsList) {
    const seedsPath = ltrim(ltrim(path, srcPath()).replaceAll("\\", "/"), "/");
    addImport(`import "${seedsPath}"`);
  }

  await saveAs("seeds");

  return `import "./seeds"`;
}
