import { log } from "@mongez/logger";
import { GenericObject } from "@mongez/reinforcements";
import { CacheDriver, NullCacheDriverOptions } from "../types";
import { BaseCacheDriver } from "./base-cache-driver";

export class NullCacheDriver
  extends BaseCacheDriver<NullCacheDriver, NullCacheDriverOptions>
  implements CacheDriver<NullCacheDriver, NullCacheDriverOptions>
{
  /**
   * Options list
   */
  public options: GenericObject = {};

  /**
   * {@inheritdoc}
   */
  public name = "null";

  /**
   * Cached data
   */
  public data: GenericObject = {};

  /**
   * {@inheritdoc}
   */
  public get client() {
    return this;
  }

  /**
   * Constructor
   */
  public constructor(options: GenericObject = {}) {
    super();
    this.setOptions(options);
  }

  /**
   * {@inheritdoc}
   */
  public setOptions(options: GenericObject) {
    this.options = options;
    return this;
  }

  /**
   * {@inheritdoc}
   */
  public parseKey(_key: string | GenericObject) {
    return "";
  }

  /**
   * {@inheritdoc}
   */
  public async removeNamespace(namespace: string) {
    log.info("cache", "clearing namespace", namespace);

    log.success("cache", "namespace cleared", namespace);

    return this;
  }

  /**
   * {@inheritdoc}
   */
  public async set(key: string | GenericObject, _value: any) {
    log.info("cache", "setting key", key);

    log.success("cache", "key set", key);

    return this;
  }

  /**
   * {@inheritdoc}
   */
  public async get(key: string | GenericObject) {
    log.info("cache", "fetching", key);

    log.success("cache", "fetched", key);

    return null;
  }

  /**
   * {@inheritdoc}
   */
  public async remove(key: string | GenericObject) {
    log.info("cache", "removing", key);

    log.success("cache", "removed", key);
  }

  /**
   * {@inheritdoc}
   */
  public async flush() {
    log.info("cache", "flushing");

    log.success("cache", "flushed");
  }

  /**
   * {@inheritdoc}
   */
  public async connect() {
    log.success("cache", "connected");
  }
}
