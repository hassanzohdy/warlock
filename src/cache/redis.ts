import { log } from "@mongez/logger";
import { GenericObject } from "@mongez/reinforcements";
import { createClient } from "redis";
import { requestContext } from "../http/middleware/inject-request-context";
import { CacheDriver } from "./types";

export type RedisOptions = {
  port?: number;
  host?: string;
  password?: string;
  username?: string;
  url?: string;
};

export const redisCache: CacheDriver<
  ReturnType<typeof createClient>,
  RedisOptions
> = {
  client: undefined,
  options: {},
  setOptions(options) {
    this.options = options;
    return this;
  },
  async removeByNamespace(namespace: string) {
    const { request } = requestContext();

    if (request) {
      namespace = request.domain + "." + namespace;
    }

    log.info("redis", "clearing namespace", namespace);

    const keys = await this.client?.keys(`${namespace}.*`);

    if (!keys || keys.length === 0) {
      log.info("redis", "empty namespace", namespace);
      return;
    }

    await this.client?.del(keys);

    log.success("redis", "namespace cleared", namespace);

    return keys;
  },
  parseKey(key: string | GenericObject) {
    if (typeof key === "object") {
      key = JSON.stringify(key);
    }

    const { request } = requestContext();
    if (request) {
      key = request.domain + "." + key;
    }

    return key;
  },
  async set(key: string | GenericObject, value: any) {
    log.info("redis", "caching", key);

    await this.client?.set(this.parseKey(key), JSON.stringify(value));

    log.success("redis", "cached", key);

    return value;
  },
  async get(key: string | GenericObject) {
    log.info("redis", "getting", key);
    const value = await this.client?.get(this.parseKey(key));

    if (!value) {
      log.info("redis", "not found", key);
      return null;
    }

    log.success("redis", "got", key);

    return JSON.parse(value);
  },
  async remove(key: string | GenericObject) {
    log.info("redis", "removing", key);
    await this.client?.del(this.parseKey(key));
    log.success("redis", "removed", key);
  },
  async flush() {
    log.info("redis", "flushing");
    await this.client?.flushAll();
    log.success("redis", "flushed");
  },
  async connect() {
    if (this.client) return this.client;

    const options = this.options;

    if (options && !options.url && options.host) {
      const auth =
        options.password || options.username
          ? `${options.username}:${options.password}@`
          : "";

      options.url = `redis://${auth}${options.host}:${options.port || 6379}`;
    }

    log.info("redis", "connection", "Connecting to Redis...");

    this.client = createClient(options);

    this.client.on("error", error => {
      log.error("cache", "redis", error);
    });

    await this.client.connect();

    log.success("redis", "connection", "Connected Successfully");

    return this.client;
  },
};
