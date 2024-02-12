import Fastify from "fastify";

export type FastifyInstance = ReturnType<typeof Fastify>;

// Instantiate Fastify server
let server: FastifyInstance | undefined = undefined;

export function startServer() {
  return (server = Fastify({
    trustProxy: true,
    // logger: true,
    bodyLimit: 200 * 1024 * 1024 * 1024, // 200GB
  }));
}

/**
 * Expose the server to be publicly accessible
 */
export function getServer() {
  return server;
}
