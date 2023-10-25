import { connectToDatabase } from "@mongez/monpulse";
import { connectToCache } from "./cache";
import { createHttpApplication } from "./http";

export async function startHttpApplication() {
  connectToCache();

  connectToDatabase();

  createHttpApplication();
}
