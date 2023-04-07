import fastifyJwt from "@fastify/jwt";
import fastifyMultipart from "@fastify/multipart";
import config from "@mongez/config";
import { registerPlugin } from "./server";

export async function registerHttpPlugins() {
  // 👇🏻 register rate-limit plugin
  await registerPlugin(import("@fastify/rate-limit"), {
    // max requests per time window
    max: config.get("http.rateLimit.max", 60),
    // maximum time that is will allow max requests
    timeWindow: config.get("http.rateLimit.duration", 60 * 1000),
  });

  // 👇🏻 register cors plugin
  await registerPlugin(import("@fastify/cors"), {
    // options list
    origin: config.get("cors.origin", "*"),
    methods: config.get("cors.methods", "*"),
    // preflight: false,
    // strictPreflight: false,
  });

  // 👇🏻 import multipart plugin
  registerPlugin(fastifyMultipart, {
    attachFieldsToBody: true,
  });

  // 👇🏻 use the jwt plugin with your preferred secret key
  registerPlugin(fastifyJwt, {
    secret: config.get("auth.jwt.secret", ""),
  });
}
