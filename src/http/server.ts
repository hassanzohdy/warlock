import Fastify from "fastify";

// Instantiate Fastify server
const server = Fastify();

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
