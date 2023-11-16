import { colors } from "@mongez/copper";
import { loadEnv } from "@mongez/dotenv";
import { captureAnyUnhandledRejection } from "@mongez/logger";
import { initializeDayjs } from "@mongez/time-wizard";
import { environment } from "./utils/environment";

export async function bootstrap() {
  const environmentMode =
    environment() === "production"
      ? colors.cyan("production")
      : colors.green("development");

  console.log(`Application is running in ${environmentMode} mode`);

  loadEnv();
  initializeDayjs();
  captureAnyUnhandledRejection();
}
