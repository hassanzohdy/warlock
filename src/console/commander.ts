import { program, type Command } from "commander";
import {
  disconnectCache,
  disconnectDatabase,
  setupCache,
  setupDatabase,
} from "../bootstrap/setup";
import { createHttpApplication, stopHttpApplication } from "../http";

program.name("Warlock Node CLI").description("Warlock CLI");

export function registerCommand(command: Command) {
  const options = command.opts();

  if (options.$preload) {
    command.hook("preAction", async () => {
      if (options.$preload.includes("database")) {
        await setupDatabase();
      }

      if (options.$preload.includes("cache")) {
        await setupCache();
      }

      if (options.$preload.includes("http")) {
        await createHttpApplication();
      }
    });
  }

  command.hook("postAction", async () => {
    if (options.$preload) {
      if (options.$preload.includes("database")) {
        await disconnectDatabase();
      }

      if (options.$preload.includes("cache")) {
        await disconnectCache();
      }

      if (options.$preload.includes("http")) {
        await stopHttpApplication();
      }
    }

    if (!options.$preload?.includes("watch")) {
      process.exit(0);
    }
  });

  program.addCommand(command);
}

export function registerCommands(commands: Command[]) {
  commands.forEach(registerCommand);
}

export async function startConsoleApplication() {
  program.parse(process.argv);
}

export type PreloadConsole = "database" | "cache" | "http" | "watch";

export function preloadCommand(command: Command, preload: PreloadConsole[]) {
  command.opts().$preload = preload;

  return command;
}
