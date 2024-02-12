import { GenericObject } from "@mongez/reinforcements";
import { NullCacheDriver } from "./drivers";
import { CacheConfigurations, CacheDriver, DriverClass } from "./types";

export class CacheManager implements CacheDriver<any, any> {
  /**
   * Cache Driver
   */
  public currentDriver: CacheDriver<any, any> = new NullCacheDriver();

  /**
   * Loaded drivers
   */
  public loadedDrivers: Record<string, CacheDriver<any, any>> = {};

  /**
   * Configurations list
   */
  protected configurations: CacheConfigurations = {
    drivers: {},
  } as any;

  /**
   * {@inheritdoc}
   */
  public name = "cacheManager";

  /**
   * {@inheritdoc}
   */
  public get client() {
    return this.currentDriver?.client;
  }

  /**
   * Set the cache configurations
   */
  public setCacheConfigurations(configurations: CacheConfigurations) {
    this.configurations.default = configurations.default;
    this.configurations.drivers = configurations.drivers;
    this.configurations.options = configurations.options;
  }

  /**
   * Use the given driver
   */
  public async use(driver: string | CacheDriver<any, any>) {
    if (typeof driver === "string") {
      const driverInstance = await this.load(driver);

      if (!driverInstance) {
        throw new Error(
          `Cache driver ${driver} is not found, please declare it in the cache drivers in the configurations list.`,
        );
      }

      driver = driverInstance;
    }

    this.currentDriver = driver;
    return this;
  }

  /**
   * {@inheritdoc}
   */
  public async get(key: string) {
    return this.currentDriver?.get(key);
  }

  /**
   * {@inheritdoc}
   */
  public async set(key: string, value: any, ttl?: number) {
    return this.currentDriver?.set(key, value, ttl);
  }

  /**
   * {@inheritdoc}
   */
  public async remove(key: string) {
    return this.currentDriver?.remove(key);
  }

  /**
   * {@inheritdoc}
   */
  public async removeNamespace(namespace: string) {
    return this.currentDriver?.removeNamespace(namespace);
  }

  /**
   * {@inheritdoc}
   */
  public async flush() {
    return this.currentDriver?.flush();
  }

  /**
   * {@inheritdoc}
   */
  public async connect() {
    return this.currentDriver?.connect();
  }

  /**
   * {@inheritdoc}
   */
  public parseKey(key: string | GenericObject) {
    return this.currentDriver?.parseKey(key) || "";
  }

  /**
   * {@inheritdoc}
   */
  public get options() {
    return this.currentDriver?.options;
  }

  /**
   * {@inheritdoc}
   */
  public setOptions(options: GenericObject) {
    return this.currentDriver?.setOptions(options);
  }

  /**
   * Get an instance of the cache driver
   */
  public async driver(driverName: string) {
    return this.loadedDrivers[driverName] || (await this.load(driverName));
  }

  /**
   * Initialize the cache manager and pick the default driver
   */
  public async init() {
    const defaultCacheDriverName = this.configurations.default;

    if (!defaultCacheDriverName) {
      return;
    }

    const driver = await this.driver(defaultCacheDriverName);

    await this.use(driver);
  }

  /**
   * Load the given cache driver name
   */
  public async load(driver: string) {
    if (this.loadedDrivers[driver]) return this.loadedDrivers[driver];

    const Driver = (this.configurations.drivers as any)[driver];

    if (!Driver) {
      throw new Error(
        `Cache driver ${driver} is not found, please declare it in the cache drivers in the configurations list.`,
      );
    }

    const driverInstance = new Driver();

    driverInstance.setOptions((this.configurations.options as any)[driver]);

    await driverInstance.connect();

    this.loadedDrivers[driver] = driverInstance;

    return driverInstance as CacheDriver<any, any>;
  }

  /**
   * Register and bind a driver
   */
  public registerDriver(driverName: string, driverClass: DriverClass) {
    (this.configurations.drivers as any)[driverName] = driverClass;
  }
}

export const cache = new CacheManager();
