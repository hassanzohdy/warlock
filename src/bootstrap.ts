import { loadEnv } from "@mongez/dotenv";
import { captureAnyUnhandledRejection } from "@mongez/logger";
import { initializeDayjs } from "@mongez/time-wizard";
import { colors} from "@mongez/copper";

export async function bootstrap() {
  const environment =
    process.env.NODE_ENV === "production"
      ? colors.cyan("production")
      : colors.green("development");

  console.log(`Application is running in ${environment} mode`);

  loadEnv();
  initializeDayjs();
  captureAnyUnhandledRejection();
}
