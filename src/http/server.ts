import Fastify from "fastify";

// Instantiate Fastify server
const server = Fastify({
  trustProxy: true,
  // logger: true,
  bodyLimit: 200 * 1024 * 1024 * 1024, // 200GB
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
