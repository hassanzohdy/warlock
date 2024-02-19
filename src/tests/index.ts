import config from "@mongez/config";
import { connectToDatabase } from "@mongez/monpulse";
import { buildTestServer } from "./cli";
import { TestsConfigurations } from "./types";
export * from "./create-http-test-application";

(globalThis as any)._connected = false;

export async function startTestApplication() {
  await buildTestServer();
  const { database = true } = config.get("tests", {}) as TestsConfigurations;

  if (database && !(globalThis as any)._connected) {
    (globalThis as any)._connected = true;
    connectToDatabase();
  }
}
