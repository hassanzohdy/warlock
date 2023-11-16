import { log } from "@mongez/logger";
import { GenericObject } from "@mongez/reinforcements";
import { CacheData, CacheDriver } from "../types";
import { parseCacheKey } from "../utils";

export type OperationType =
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

const messages = {
  clearing: "Clearing namespace",
  cleared: "Namespace cleared",
  fetching: "Fetching key",
  fetched: "Key fetched",
  caching: "Caching key",
  cached: "Key cached",
  flushing: "Flushing cache",
  flushed: "Cache flushed",
  removing: "Removing key",
  removed: "Key removed",
  expired: "Key expired",
  notFound: "Key not found",
  connecting: "Connecting to the cache engine.",
  connected: "Connected to the cache engine.",
  error: "Error occurred",
};

export abstract class BaseCacheDriver<ClientType, Options extends GenericObject>
  implements CacheDriver<ClientType, Options>
{
  /**
   * CLient driver
   */
  protected clientDriver!: ClientType;

  /**
   * {@inheritdoc}
   */
  public get client() {
    return (this.clientDriver || this) as unknown as ClientType;
  }

  /**
   * Set client driver
   */
  public set client(client: ClientType) {
    this.clientDriver = client;
  }

  /**
   * Get the cache driver name
   */
  public abstract name: string;

  /**
   * Options list
   */
  public options: Options = {} as any;

  /**
   * {@inheritdoc}
   */
  public parseKey(key: string | GenericObject) {
    return parseCacheKey(key, this.options);
  }

  /**
   * {@inheritdoc}
   */
  public setOptions(options: Options) {
    this.options = options || {};
    return this;
  }

  /**
   * {@inheritdoc}
   */
  public abstract removeNamespace(namespace: string): Promise<any>;

  /**
   * {@inheritdoc}
   */
  public abstract set(key: string | GenericObject, value: any): Promise<any>;

  /**
   * {@inheritdoc}
   */
  public abstract get(key: string | GenericObject): Promise<any>;

  /**
   * {@inheritdoc}
   */
  public abstract remove(key: string | GenericObject): Promise<void>;

  /**
   * {@inheritdoc}
   */
  public abstract flush(): Promise<void>;

  /**
   * Log the operation
   */
  protected log(operation: OperationType, key?: string) {
    if (key) {
      // this will be likely used with file cache driver as it will convert the dot to slash
      // to make it consistent and not to confuse developers we will output the key by making sure it's a dot
      key = key.replaceAll("/", ".");
    }

    if (operation == "notFound" || operation == "expired") {
      return log.error(
        "cache:" + this.name,
        operation,
        (key ? key + " " : "") + messages[operation],
      );
    }

    if (operation.endsWith("ed")) {
      return log.success(
        "cache:" + this.name,
        operation,
        (key ? key + " " : "") + messages[operation],
      );
    }

    log.info(
      "cache:" + this.name,
      operation,
      (key ? key + " " : "") + messages[operation],
    );
  }

  /**
   * Get time to live value
   */
  public get ttl() {
    return this.options.ttl !== undefined ? this.options.ttl : Infinity;
  }

  /**
   * Get time to live value in milliseconds
   */
  public getTtl(ttl: number = this.ttl) {
    if (ttl) {
      return new Date().getTime() + ttl * 1000;
    }
  }

  /**
   * Prepare data for storage
   */
  protected prepareDataForStorage(data: any, ttl?: number) {
    const preparedData: CacheData = {
      data,
    };

    if (ttl) {
      preparedData.expiresAt = this.getTtl(ttl);
    }

    return preparedData;
  }

  /**
   * Parse fetched data from cache
   */
  protected async parseCachedData(key: string, data: CacheData) {
    if (data.expiresAt && data.expiresAt < new Date().getTime()) {
      this.log("expired", key);

      return this.remove(key);
    }

    this.log("fetched", key);

    return data.data || null;
  }

  /**
   * {@inheritdoc}
   */
  public async connect() {
    this.log("connecting");
    this.log("connected");
  }
}
