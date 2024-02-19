import { registerHttpPlugins } from "../http/plugins";
import { startServer } from "../http/server";
import { router } from "../router/router";

export async function createTestHttpApplication() {
  const server = startServer();

  await registerHttpPlugins(server);

  router.scan(server);

  await server.ready();

  return server;
}
