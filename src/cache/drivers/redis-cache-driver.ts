import { GenericObject } from "@mongez/reinforcements";
import { createClient } from "redis";
import { CacheData, CacheDriver, RedisOptions } from "../types";
import { parseCacheKey } from "../utils";
import { BaseCacheDriver } from "./base-cache-driver";

export class RedisCacheDriver
  extends BaseCacheDriver<ReturnType<typeof createClient>, RedisOptions>
  implements CacheDriver<ReturnType<typeof createClient>, RedisOptions>
{
  /**
   * Cache driver name
   */
  public name = "redis";

  /**
   * {@inheritDoc}
   */
  public async removeNamespace(namespace: string) {
    namespace = this.parseKey(namespace);

    this.log("clearing", namespace);

    const keys = await this.client?.keys(`${namespace}*`);

    if (!keys || keys.length === 0) {
      this.log("notFound", namespace);
      return;
    }

    await this.client?.del(keys);

    this.log("cleared", namespace);

    return keys;
  }

  /**
   * {@inheritdoc}
   */
  public parseKey(key: string | GenericObject) {
    return parseCacheKey(key, this.options);
  }

  /**
   * {@inheritDoc}
   */
  public async set(key: string | GenericObject, value: any, ttl?: number) {
    key = this.parseKey(key);

    this.log("caching", key);

    ttl = this.getTtl(ttl);

    const data = this.prepareDataForStorage(value, ttl);

    await this.client?.set(key, JSON.stringify(data));

    this.log("cached", key);

    return value;
  }

  /**
   * {@inheritDoc}
   */
  public async get(key: string | GenericObject) {
    key = this.parseKey(key);

    this.log("fetching", key);

    const value = await this.client?.get(key);

    if (!value) {
      this.log("notFound", key);
      return null;
    }

    const data: CacheData = JSON.parse(value);

    return this.parseCachedData(key, data);
  }

  /**
   * {@inheritDoc}
   */
  public async remove(key: string | GenericObject) {
    key = this.parseKey(key);

    this.log("removing", key);

    await this.client?.del(key);

    this.log("removed", key);
  }

  /**
   * {@inheritDoc}
   */
  public async flush() {
    this.log("flushing");

    if (this.options.globalPrefix) {
      await this.removeNamespace("");
    } else {
      await this.client?.flushAll();
    }

    this.log("flushed");
  }

  /**
   * {@inheritDoc}
   */
  public async connect() {
    if (this.clientDriver) return;

    const options = this.options;

    if (options && !options.url && options.host) {
      const auth =
        options.password || options.username
          ? `${options.username}:${options.password}@`
          : "";

      if (!options.url) {
        const host = options.host || "localhost";
        const port = options.port || 6379;
        options.url = `redis://${auth}${host}:${port}`;
      }
    }

    const clientOptions = {
      ...options,
      ...(this.options.clientOptions || {}),
    };

    this.log("connecting");

    this.client = createClient(clientOptions);

    this.client.on("error", error => {
      this.log("error", error.message);
    });
    try {
      await this.client.connect();

      this.log("connected");
    } catch (error) {
      //
    }
  }

  /**
   * {@inheritDoc}
   */
  public async disconnect() {
    if (!this.client) return;

    this.log("disconnecting");

    await this.client.quit();

    this.log("disconnected");
  }
}
