import Fastify from "fastify";

// Instantiate Fastify server
const server = Fastify({
  trustProxy: true,
  logger: true,
  bodyLimit: 20 * 1024 * 1024 * 1024, // 20GB
});

/**
 * Expose the server to be publicly accessible
 */
export function getServer() {
  return server;
}

/**
 * Register single plugin
 */
export const registerPlugin = server.register.bind(server);
