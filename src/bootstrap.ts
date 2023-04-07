import { loadEnv } from "@mongez/dotenv";
import { captureAnyUnhandledRejection } from "@mongez/logger";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import duration from "dayjs/plugin/duration";
import relativeTime from "dayjs/plugin/relativeTime";

export function bootstrap() {
  loadEnv();
  dayjs.extend(duration);
  dayjs.extend(relativeTime);
  dayjs.extend(customParseFormat);
  captureAnyUnhandledRejection();
}
