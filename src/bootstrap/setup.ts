import config from "@mongez/config";
import { colors } from "@mongez/copper";
import { connectToDatabase, connection } from "@mongez/monpulse";
import { cache } from "../cache";
import { environment } from "../utils";

export async function setupCache() {
  const cacheConfig = config.get("cache");

  if (!cacheConfig) return;

  cache.setCacheConfigurations(cacheConfig);

  await cache.init();
}

export async function disconnectCache() {
  await cache.disconnect();
}

export async function setupDatabase() {
  const databaseConfig = config.get("database");

  if (!databaseConfig) return;

  await connectToDatabase(databaseConfig);
}

export async function disconnectDatabase() {
  await connection.client.close();
}

export async function executeDatabaseThenDisconnect(
  callback: () => Promise<any>,
) {
  await setupDatabase();

  await callback();

  await disconnectDatabase();
}

export function displayEnvironmentMode() {
  const env = environment();

  const envColor = (env: string) => {
    switch (env) {
      case "development":
        return colors.yellow(env);
      case "production":
        return colors.green(env);
      case "test":
        return colors.magentaBright(env);
    }
  };

  console.log(
    colors.blueBright("ℹ"),
    colors.yellow(`(${new Date().toISOString()})`),
    colors.orange("[warlock]"),
    colors.magenta(`bootstrap`),
    colors.blueBright(`Starting application in ${envColor(env)} mode`),
  );
}
