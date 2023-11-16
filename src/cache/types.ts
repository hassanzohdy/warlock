import { GenericObject } from "@mongez/reinforcements";

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

export type CacheConfigurations = {
  /**
   * The default cache driver name
   */
  default?: string;
  /**
   * The cache drivers list
   */
  drivers: {
    [name: string]: DriverClass;
  };
  /**
   * The cache driver options
   */
  options: {
    [name: string]: any;
  };
};
