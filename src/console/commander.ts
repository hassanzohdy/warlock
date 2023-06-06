import { Command } from "commander";
import { bootstrap } from "../bootstrap";
import {
  ConfigurationsLoader,
  prepareConfigurations,
} from "../load-configurations";
const program = new Command();

program.name("Warlock Node CLI").description("Warlock CLI").version("0.8.0");

export function registerCommand(command: Command) {
  program.addCommand(command);
}

export function registerCommands(commands: Command[]) {
  commands.forEach(command => registerCommand(command));
}

export type ConsoleApplicationConfigurations = {
  config: ConfigurationsLoader;
};

export async function startConsoleApplication({
  config,
}: ConsoleApplicationConfigurations) {
  bootstrap();

  await prepareConfigurations(config);

  program.parse(process.argv);
}
