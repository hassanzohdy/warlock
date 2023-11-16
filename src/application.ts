import { connectToDatabase } from "@mongez/monpulse";
import { cache } from "./cache";
import { createHttpApplication } from "./http";

export async function startHttpApplication() {
  cache.init();

  connectToDatabase();

  createHttpApplication();
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
};
