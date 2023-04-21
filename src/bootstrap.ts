import { loadEnv } from "@mongez/dotenv";
import { captureAnyUnhandledRejection } from "@mongez/logger";
import { initializeDayjs } from "@mongez/time-wizard";

export function bootstrap() {
  loadEnv();
  initializeDayjs();
  captureAnyUnhandledRejection();
}
