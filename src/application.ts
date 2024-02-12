import events from "@mongez/events";
import { connectToDatabase } from "@mongez/monpulse";
import { cache } from "./cache";
import { createHttpApplication } from "./http";

export async function startHttpApplication() {
  cache.init();

  await Promise.all([connectToDatabase(), createHttpApplication()]);

  events.trigger("app.http.started");
}

export type AppConfigurations = {
  /**
   * Default locale code
   *
   * @default en
   */
  localeCode?: string;
  /**
   * Application base URL
   *
   * @default localhost:
   */
  baseUrl?: string;
  /**
   * Application timezone
   */
  timezone?: string;
  /**
   * Locale Codes list
   */
  localeCodes?: string[];
};
