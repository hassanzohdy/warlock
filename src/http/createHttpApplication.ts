import config from "@mongez/config";
import { log } from "@mongez/logger";
import { router } from "../router";
import { setBaseUrl } from "../utils/urls";
import { httpConfig } from "./config";
import { registerHttpPlugins } from "./plugins";
import { getServer } from "./server";

export type HttpApplicationConfigurations = {
  bootstrap: () => Promise<any>;
};

export async function createHttpApplication(
  configurations: HttpApplicationConfigurations,
) {
  const server = getServer();

  // import app/bootstrap.ts file from cwd + /src/app/bootstrap.ts
  await configurations.bootstrap();

  await registerHttpPlugins();

  router.scan(server);

  try {
    log.info("http", "server", "Connecting to the server");
    // 👇🏻 We can use the url of the server
    const baseUrl = await server.listen({
      port: httpConfig("port"),
      host: httpConfig("host"),
    });

    // update base url
    setBaseUrl(config.get("app.baseUrl"));

    log.success("http", "server", `Server is listening on ${baseUrl}`);
  } catch (error) {
    log.error("http", "server", error);

    process.exit(1); // stop the process, exit with error
  }
}
