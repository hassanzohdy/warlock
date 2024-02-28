import { Command } from "commander";
import { setupCache, setupDatabase } from "../bootstrap/setup";
import { createHttpApplication } from "../http";
const program = new Command();

// const packageJson = getJsonFile(internalWarlockPath("package.json"));

program.name("Warlock Node CLI").description("Warlock CLI");
// .version(packageJson.version);

export function registerCommand(command: Command) {
  program.addCommand(command);
}

export function registerCommands(commands: Command[]) {
  commands.forEach(registerCommand);
}

export async function startConsoleApplication() {
  await Promise.all([setupCache(), setupDatabase(), createHttpApplication()]);

  // program.hook("postAction", () => {
  //   process.exit(0);
  // });

  program.parse(process.argv);
}
