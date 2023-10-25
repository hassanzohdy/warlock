import { loadEnv } from "@mongez/dotenv";
import { captureAnyUnhandledRejection } from "@mongez/logger";
import { initializeDayjs } from "@mongez/time-wizard";
import chalk from "chalk";

export async function bootstrap() {
  const environment =
    process.env.NODE_ENV === "production"
      ? chalk.cyan("production")
      : chalk.green("development");

  console.log(`Bootstrapping Application in ${environment} mode`);

  loadEnv();
  initializeDayjs();
  captureAnyUnhandledRejection();
}
