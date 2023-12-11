import { GenericObject, get, set, unset } from "@mongez/reinforcements";
import { CacheDriver } from "../types";
import { BaseCacheDriver } from "./base-cache-driver";

export type MemoryCacheOptions = {
  /**
   * The global prefix for the cache key
   */
  globalPrefix?: string | (() => string);
  /**
   * The default TTL for the cache in seconds
   *
   * @default Infinity
   */
  ttl?: number;
};

export class MemoryCacheDriver
  extends BaseCacheDriver<MemoryCacheDriver, MemoryCacheOptions>
  implements CacheDriver<MemoryCacheDriver, MemoryCacheOptions>
{
  /**
   * {@inheritdoc}
   */
  public name = "memory";

  /**
   * Cached data
   */
  public data: GenericObject = {};

  /**
   * List of data that will be cleared from cache
   */
  protected temporaryData: Record<string, number> = {};

  /**
   * {@inheritdoc}
   */
  public constructor() {
    super();

    this.startCleanup();
  }

  /**
   * Start the cleanup process whenever a data that has a cache key is set
   */
  public startCleanup() {
    const interval = setInterval(() => {
      const now = Date.now();

      for (const key in this.temporaryData) {
        if (this.temporaryData[key] <= now) {
          this.remove(key);
          delete this.temporaryData[key];
          this.log("expired", key);
        }
      }
    }, 1000);

    // do not block the process from exiting
    interval.unref();
  }

  /**
   * {@inheritdoc}
   */
  public async removeNamespace(namespace: string) {
    this.log("clearing", namespace);

    namespace = await this.parseKey(namespace);

    unset(this.data, [namespace]);

    this.log("cleared", namespace);

    return this;
  }

  /**
   * {@inheritdoc}
   */
  public async set(key: string | GenericObject, value: any, ttl?: number) {
    key = await this.parseKey(key);

    this.log("caching", key);

    const data = this.prepareDataForStorage(value, ttl);

    if (ttl) {
      // it means we need to check for expiration
      this.temporaryData[key] = Date.now() + ttl * 1000;
    }

    set(this.data, key, data);

    this.log("cached", key);

    return this;
  }

  /**
   * {@inheritdoc}
   */
  public async get(key: string | GenericObject) {
    const parsedKey = await this.parseKey(key);

    this.log("fetching", parsedKey);

    const value = get(this.data, parsedKey);

    if (!value) {
      this.log("notFound", parsedKey);
      return null;
    }

    return this.parseCachedData(parsedKey, value);
  }

  /**
   * {@inheritdoc}
   */
  public async remove(key: string | GenericObject) {
    const parsedKey = await this.parseKey(key);

    this.log("removing", parsedKey);

    unset(this.data, [parsedKey]);

    this.log("removed", parsedKey);
  }

  /**
   * {@inheritdoc}
   */
  public async flush() {
    this.log("flushing");
    if (this.options.globalPrefix) {
      this.removeNamespace("");
    } else {
      this.data = {};
    }

    this.log("flushed");
  }
}
