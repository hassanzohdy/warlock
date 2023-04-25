import { log } from "@mongez/logger";
import { connectToDatabase } from "@mongez/mongodb";
import chalk from "chalk";
import { bootstrap } from "./bootstrap";
import { connectToCache } from "./cache";
import { createHttpApplication } from "./http";
import { prepareConfigurations } from "./load-configurations";

export async function startHttpApplication() {
  await bootstrap();

  await prepareConfigurations();

  const environment =
    process.env.NODE_ENV === "production"
      ? chalk.cyan("production")
      : chalk.green("development");

  log.info(
    "application",
    process.env.NODE_ENV === "production" ? "production" : "development",
    `Bootstrapping Application in ${environment} mode`,
  );

  connectToDatabase();
  connectToCache();
  createHttpApplication();
}
