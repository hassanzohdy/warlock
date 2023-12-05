import { colors } from "@mongez/copper";
import { loadEnv } from "@mongez/dotenv";
import { captureAnyUnhandledRejection } from "@mongez/logger";
import { initializeDayjs } from "@mongez/time-wizard";
import { environment } from "./utils/environment";

export async function bootstrap() {
  console.log(
    colors.blueBright("ℹ"),
    colors.yellow(`(${new Date().toISOString()})`),
    colors.orange("[warlock]"),
    colors.magenta(`[${environment()}]`),
    colors.blueBright("Starting the http application"),
  );

  loadEnv();
  initializeDayjs();
  captureAnyUnhandledRejection();
}
