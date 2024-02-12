import config from "@mongez/config";
import { connectToDatabase } from "@mongez/monpulse";
import { createHttpApplication } from "../http/createHttpApplication";
import { TestsConfigurations } from "./types";

(globalThis as any)._connected = false;

export function startTestApplication() {
  const { database = true } = config.get("tests", {}) as TestsConfigurations;

  createHttpApplication();

  if (database && !(globalThis as any)._connected) {
    (globalThis as any)._connected = true;
    connectToDatabase();
  }
}

// (globalThis as any)._testRequest = null as ReturnType<typeof request> | null;

// console.log("In");

// export function testRequest(): ReturnType<typeof request> {
//   if ((globalThis as any)._testRequest) {
//     return (globalThis as any)._testRequest;
//   }
//   const server = getServer();

//   if (!server) {
//     throw new Error("Server is not running");
//   }

//   (globalThis as any)._testRequest = request(server.server);

//   return (globalThis as any)._testRequest;
// }
