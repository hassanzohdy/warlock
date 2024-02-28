import config from "@mongez/config";
import { connectToDatabase } from "@mongez/monpulse";
import { cache } from "../cache";

export async function setupCache() {
  const cacheConfig = config.get("cache");

  if (!cacheConfig) return;

  cache.setCacheConfigurations(cacheConfig);

  await cache.init();
}

export async function setupDatabase() {
  const databaseConfig = config.get("database");

  if (!databaseConfig) return;

  await connectToDatabase(databaseConfig);
}
