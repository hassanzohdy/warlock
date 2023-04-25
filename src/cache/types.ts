import { GenericObject } from "@mongez/reinforcements";

export type CacheDriver<ClientType, Options> = {
  /**
   * The cache driver options
   */
  options: Options;
  /**
   *  Remove all cached items by namespace
   */
  removeByNamespace(namespace: string): Promise<string[] | undefined>;
  /**
   * Set the cache driver options
   */
  setOptions(options: Options): CacheDriver<ClientType, Options>;
  /**
   * Parse the key to be used in the cache
   */
  parseKey(key: string | GenericObject): string;
  /**
   * Set a value in the cache
   */
  set(key: string | GenericObject, value: any): Promise<any>;
  /**
   * Get a value from the cache
   */
  get(key: string | GenericObject): Promise<any>;
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
  /**
   * Any other properties
   */
  [key: string]: any;
};
