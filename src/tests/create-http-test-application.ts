import { ensureDirectoryAsync, fileExists, putFileAsync } from "@mongez/fs";
import { log } from "@mongez/logger";
import { Command } from "commander";
import { InjectOptions } from "fastify";
import { setupDatabase } from "../bootstrap/setup";
import {
  createAppBuilder,
  createBootstrapFile,
  loadEventFiles,
  loadLocalesFiles,
  loadMainFiles,
  loadRoutesFiles,
} from "../builder/app-builder";
import { createConfigLoader } from "../builder/config-loader-builder";
import { preloadCommand } from "../console";
import { registerHttpPlugins } from "../http/plugins";
import { startServer } from "../http/server";
import { router } from "../router/router";
import { rootPath, setEnvironment, warlockPath } from "../utils";
import { TestResponse } from "./test-response";

export async function createTestingAppFile() {
  const { addImport, addContent, saveAs } = createAppBuilder();

  await ensureDirectoryAsync(warlockPath());

  const data = await Promise.all([
    createBootstrapFile(),
    createConfigLoader(),
    loadMainFiles(),
    loadRoutesFiles(),
    loadEventFiles(),
    loadLocalesFiles(),
  ]);

  addImport(...data);
  addImport("import {setupDatabase, testRequest } from '@mongez/warlock'");

  addContent(`
  export { setupDatabase, testRequest };
  `);

  // check if the test-setup.ts not exists
  // if so, then we need to create it
  if (!fileExists(rootPath("test-setup.ts"))) {
    await putFileAsync(
      rootPath("test-setup.ts"),
      `// Please do not remove this line, the following import is used for loading the app.
import "./.warlock/test";

export * from "@mongez/warlock";
`,
    );
  }

  await saveAs("test");
}

export function registerTestCommand() {
  return preloadCommand(new Command("test").action(createTestingAppFile), []);
}

let server: ReturnType<typeof startServer> | undefined;

export async function testRequest() {
  if (!server) {
    log.info("http", "server", "Connecting to the server");

    server = startServer();

    setEnvironment("test");

    await registerHttpPlugins(server);

    router.scan(server);

    await server.ready();

    log.success("http", "server", "Server is ready");

    await setupDatabase();
  }

  const request = (method: InjectOptions["method"]) => {
    return async (path: string, payload?: any, options?: InjectOptions) => {
      const response = await server!.inject({
        method,
        path,
        payload,
        ...options,
      });

      return new TestResponse(response);
    };
  };

  const jsonRequest = (method: InjectOptions["method"]) => {
    return (
      path: string,
      payload: any = {},
      { headers = {}, ...options }: InjectOptions = {},
    ) => {
      if (!headers["Content-Type"]) {
        headers = {
          ...headers,
          "Content-Type": "application/json",
        };
      }

      return request(method)(path, payload, {
        headers,
        ...options,
      });
    };
  };

  return {
    get: request("GET"),
    post: jsonRequest("POST"),
    put: jsonRequest("PUT"),
    patch: jsonRequest("PATCH"),
    delete: request("DELETE"),
    json: {
      get: request("GET"),
      post: jsonRequest("POST"),
      put: jsonRequest("PUT"),
      patch: jsonRequest("PATCH"),
      delete: request("DELETE"),
    },
  };
}
