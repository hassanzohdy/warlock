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
   * {@inheritdoc}
   */
  public async removeNamespace(namespace: string) {
    this.log("clearing", namespace);

    unset(this.data, [namespace]);

    this.log("cleared", namespace);

    return this;
  }

  /**
   * {@inheritdoc}
   */
  public async set(key: string | GenericObject, value: any, ttl?: number) {
    key = this.parseKey(key);

    this.log("caching", key);

    const data = this.prepareDataForStorage(value, ttl);

    set(this.data, key, data);

    this.log("cached", key);

    return this;
  }

  /**
   * {@inheritdoc}
   */
  public async get(key: string | GenericObject) {
    const parsedKey = this.parseKey(key);

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
    const parsedKey = this.parseKey(key);

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
