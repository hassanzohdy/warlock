import { log } from "@mongez/logger";
import { GenericObject, rtrim } from "@mongez/reinforcements";
import { createClient } from "redis";
import { CacheDriver } from "../types";

export type RedisOptions = {
  port?: number;
  host?: string;
  password?: string;
  username?: string;
  url?: string;
  globalPrefix?: string | (() => string);
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
    namespace = this.parseKey(namespace);

    log.info("redis", "clearing namespace", namespace);

    const keys = await this.client?.keys(`${namespace}*`);

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
      // remove any curly braces and double quotes
    }

    key = key.replace(/[{}"]/g, "").replaceAll(":", ".").replaceAll(",", ".");

    const cachePrefix =
      typeof this.options.globalPrefix === "function"
        ? this.options.globalPrefix()
        : this.options.globalPrefix;

    return cachePrefix ? rtrim(cachePrefix, ".") + "." + key : key;
  },
  async set(key: string | GenericObject, value: any) {
    key = this.parseKey(key);
    log.info("redis", "caching", key);

    await this.client?.set(key, JSON.stringify(value));

    log.success("redis", "cached", key);

    return value;
  },
  async get(key: string | GenericObject) {
    key = this.parseKey(key);
    log.info("redis", "fetching", key);
    const value = await this.client?.get(key);

    if (!value) {
      log.info("redis", "not found", key);
      return null;
    }

    log.success("redis", "fetched", key);

    return JSON.parse(value);
  },
  async remove(key: string | GenericObject) {
    key = this.parseKey(key);
    log.info("redis", "removing", key);
    await this.client?.del(key);
    log.success("redis", "removed", key);
  },
  async flush() {
    log.info("redis", "flushing");
    if (this.options.globalPrefix) {
      await this.removeByNamespace("");
    } else {
      await this.client?.flushAll();
    }
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

      if (!options.url) {
        options.url = `redis://${auth}${options.host}:${options.port || 6379}`;
      }
    }

    log.info("redis", "connection", "Connecting to Redis...");

    this.client = createClient(options);

    this.client.on("error", error => {
      log.error("cache", "redis", error);
    });
    try {
      await this.client.connect();

      log.success("redis", "connection", "Connected Successfully");

      return this.client;
    } catch (error) {
      //
    }
  },
};
