import { Command } from "commander";
const program = new Command();

program
  .name("Mongez Node CLI")
  .description("Mongez Nodejs Backend CLI Tool")
  .version("0.8.0");

export function registerCommand(command: Command) {
  program.addCommand(command);
}

export function runCommander() {
  program.parse(process.argv);
}
