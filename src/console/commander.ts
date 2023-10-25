import { Command } from "commander";
import { bootstrap } from "../bootstrap";
const program = new Command();

program.name("Warlock Node CLI").description("Warlock CLI").version("0.8.0");

export function registerCommand(command: Command) {
  program.addCommand(command);
}

export function registerCommands(commands: Command[]) {
  commands.forEach(command => registerCommand(command));
}

export async function startConsoleApplication() {
  bootstrap();

  program.parse(process.argv);
}
