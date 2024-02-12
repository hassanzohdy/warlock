import { GenericObject } from "@mongez/reinforcements";
import { RedisClientOptions } from "redis";
import type {
  BaseCacheDriver,
  FileCacheDriver,
  MemoryCacheDriver,
  NullCacheDriver,
  RedisCacheDriver,
} from "./drivers";

export type CacheOperationType =
  | "fetching"
  | "fetched"
  | "caching"
  | "cached"
  | "flushing"
  | "flushed"
  | "removing"
  | "removed"
  | "clearing"
  | "cleared"
  | "expired"
  | "notFound"
  | "connecting"
  | "error"
  | "connected";

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

export type FileCacheOptions = {
  /**
   * The global prefix for the cache key
   */
  globalPrefix?: string | (() => string);
  /**
   * The default TTL for the cache in seconds
   *
   * @default 0
   */
  ttl?: number;
  /**
   * Storage cache directory
   *
   * @default storagePath("cache")
   */
  directory: string | (() => string);
  /**
   * File name
   *
   * @default cache.json
   */
  fileName?: string | (() => string);
};

export type RedisOptions = {
  /**
   * Redis Port
   *
   * @default 6379
   */
  port?: number;
  /**
   * Redis Host
   */
  host?: string;
  /**
   * Redis Username
   */
  username?: string;
  /**
   * Redis Password
   */
  password?: string;
  /**
   * Redis URL
   *
   * If used, it will override the host and port options
   */
  url?: string;
  /**
   * Global prefix for the cache key
   */
  globalPrefix?: string | (() => string);
  /**
   * Time to live in seconds
   *
   * @default Infinity
   */
  ttl?: number;
  /**
   * Redis client options
   */
  clientOptions?: RedisClientOptions;
};

export type NullCacheDriverOptions = GenericObject;

export interface CacheDriver<ClientType, Options> {
  /**
   * The cache driver options
   */
  options: Options;
  /**
   * Cache driver name
   */
  name: string;
  /**
   *  Remove all cached items by namespace
   */
  removeNamespace(namespace: string): Promise<any>;
  /**
   * Set the cache driver options
   */
  setOptions(options: Options): any;
  /**
   * Parse the key to be used in the cache
   */
  parseKey(key: string | GenericObject): string;
  /**
   * Set a value in the cache
   *
   * @param key The cache key, could be an object or string
   * @param value The value to be stored in the cache
   * @param ttl The time to live in seconds
   */
  set(key: string | GenericObject, value: any, ttl?: number): Promise<any>;
  /**
   * Get a value from the cache
   */
  get(key: string | GenericObject): Promise<any | null>;
  /**
   * Remove a value from the cache
   */
  remove(key: string | GenericObject): Promise<void>;
  /**
   * Flush the entire cache
   */
  flush(): Promise<void>;
  /**
   * Connect to the cache driver
   */
  connect(): Promise<any>;
  /**
   * The cache client
   */
  client?: ClientType;
}

export type CacheData = {
  /**
   * Value stored in the cache
   */
  data: any;
  /**
   * The expiration date in milliseconds
   */
  expiresAt?: number;
};

export type DriverClass = new () => CacheDriver<any, any>;

type DefaultDrivers = "redis" | "file" | "memory" | "null";

type MergeWithDefaultDrivers<T> = T extends undefined
  ? DefaultDrivers
  : DefaultDrivers | T;

export type CacheConfigurations<
  T extends string | undefined = undefined,
  DriverName = MergeWithDefaultDrivers<T>,
> = {
  /**
   * The default cache driver name
   */
  default?: DriverName;
  /**
   * The cache drivers list
   */
  drivers: {
    redis?: typeof RedisCacheDriver;
    file?: typeof FileCacheDriver;
    null?: typeof NullCacheDriver;
    memory?: typeof MemoryCacheDriver;
  } & {
    [key in Extract<T, string>]?: typeof BaseCacheDriver<any, any> | undefined;
  };
  /**
   * The cache driver options
   */
  options: {
    redis?: RedisOptions;
    file?: FileCacheOptions;
    memory?: MemoryCacheOptions;
    null?: NullCacheDriverOptions;
  } & {
    [key in Extract<T, string>]?: GenericObject;
  };
};
