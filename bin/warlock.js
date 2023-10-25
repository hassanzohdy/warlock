#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-var-requires */
// Available commands
// warlock dev
// warlock build
// warlock prod
// warlock exec
const chalk = require("chalk");
const { spawnSync } = require("child_process");

// warlock is the name of the bin so we want check it in the argsv

function parseArgs() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    return;
  }

  return {
    command: args[0],
    options: args.slice(1),
  };
}

const commandsList = {
  dev: startHttpDevelopmentServer,
  build: buildForProduction,
  start: startProductionServer,
  exec: executeCliCommands,
};

function executeCliCommands() {
  const { options } = parseArgs();

  const command = options[0];

  if (!command) {
    console.log(
      "You must specify the command you want to execute",
      chalk.red("warlock exec <command>"),
    );
    process.exit(1);
  }

  const args = options.slice(1);

  spawnSync(command, args, {
    stdio: "inherit",
    cwd: process.cwd(),
  });
}

function main() {
  const { command, options } = parseArgs();

  if (!commandsList[command]) {
    console.log("Invalid command", chalk.red(command));
    console.log(
      "Available commands",
      chalk.green(
        Object.keys(commandsList).map(command => `warlock ${command}`),
      ),
    );
    process.exit(1);
  }

  const handler = commandsList[command];

  handler(options);
}

function startHttpDevelopmentServer() {
  require("./../cjs/starters/start-http-development-server.js");
}

function buildForProduction() {
  require("./../cjs/starters/build-http-production.js");
}

function startProductionServer() {
  require("./../cjs/starters/start-http-production-server.js");
}

main();
