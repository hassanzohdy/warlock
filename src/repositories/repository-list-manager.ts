import { Model, ModelAggregate, PaginationListing } from "@mongez/monpulse";
import { GenericObject } from "@mongez/reinforcements";
import { CacheDriver, cache } from "../cache";
import { requestContext } from "../http/middleware/inject-request-context";
import { BaseRepositoryManager } from "./base-repository-manager";
import { RepositoryListing } from "./repository-listing";
import { RepositoryManager } from "./repository-manager";
import {
  CachedRepositoryOptions,
  FilterByOptions,
  RepositoryOptions,
} from "./types";
import { defaultRepositoryOptions } from "./utils";

export abstract class RepositoryListManager<
  T extends Model,
  M extends typeof Model = typeof Model,
> extends BaseRepositoryManager<T, M> {
  /**
   * List default options
   */
  protected defaultOptions: RepositoryOptions = {};

  /**
   * Default filters list
   */
  protected defaultFilters: FilterByOptions = {
    id: "int",
    ids: ["inInt", "id"],
    except: (id: any, query) => query.where("id", "!=", Number(id)),
    createdBy: ["int", "createdBy.id"],
    isActive: "boolean",
  };

  /**
   * Filter By options
   */
  protected filterBy: FilterByOptions = {};

  /**
   * List of repositories that should clear its cache when this repository is created, updated or deleted
   */
  protected clearCacheOnUpdate: RepositoryManager<any>[] = [];

  /**
   * Whether to enable caching
   */
  public isCacheable = true;

  /**
   * Cache driver
   */
  protected cacheDriver: CacheDriver<any, any> = cache;

  /**
   * Set the cache driver name
   * If set, then it will be used instead of the default value in this.cacheDriver
   */
  protected cacheDriverName = "";

  /**
   * Constructor
   */
  public constructor() {
    super();
    this.prepareCache();
  }

  /**
   * Set cache driver
   */
  public setCacheDriver(driver: CacheDriver<any, any>) {
    this.cacheDriver = driver;

    return this;
  }

  /**
   * Get cache driver
   */
  public getCacheDriver() {
    return this.cacheDriver;
  }

  /**
   * List All records
   */
  public async all(options?: Omit<RepositoryOptions, "paginate">) {
    return (await this.list({ ...options, paginate: false })).documents;
  }

  /**
   * Get all cached data
   */
  public async allCached(options?: Omit<RepositoryOptions, "paginate">) {
    return await this.cacheAll({ options, purge: options?.purgeCache });
  }

  /**
   * List All Active records
   */
  public async allActive(options?: Omit<RepositoryOptions, "paginate">) {
    return (await this.listActive({ ...options, paginate: false })).documents;
  }

  /**
   * List all active cached records
   */
  public async allActiveCached(options?: Omit<RepositoryOptions, "paginate">) {
    return await this.cacheAll({
      options: { ...options, isActive: true },
      purge: options?.purgeCache,
    });
  }

  /**
   * Prepare  cache
   */
  public async prepareCache() {
    if (!this.cacheDriver || !this.isCacheable) return;

    if (this.cacheDriverName) {
      this.cacheDriver = await cache.driver(this.cacheDriverName);
    }

    setTimeout(() => {
      this.model
        .events()
        .onSaved(async model => {
          this.clearCache();
          this.cacheModel(model as T);
          for (const repository of this.clearCacheOnUpdate) {
            repository.clearCache();
          }
        })
        .onDeleted(() => {
          this.clearCache();
          for (const repository of this.clearCacheOnUpdate) {
            repository.clearCache();
          }
        });
    }, 0);
  }

  /**
   * Cache the given model
   */
  public async cacheModel(model: T) {
    const cacheKey = this.cacheKey(`id.${model.id}`);

    await this.cache(cacheKey, model.data);
  }

  /**
   * Clear the entire cache
   */
  public async clearCache() {
    await this.cacheDriver.removeNamespace(this.cacheKey(""));
  }

  /**
   * Before listing
   * Called before listing records
   */
  public async beforeListing(
    _query: ModelAggregate<T>,
    _options: RepositoryOptions,
  ) {
    // override this method
  }

  /**
   * On list
   * Called after listing records
   */
  public async onList(records: T[]): Promise<T[]> {
    return records;
  }

  /**
   * Merge default options with the given options
   */
  protected withDefaultOptions(options: RepositoryOptions) {
    return { ...defaultRepositoryOptions, ...options };
  }

  /**
   * Add default filters along side with the given filters
   */
  public withDefaultFilters(filters: FilterByOptions = {}) {
    return { ...this.defaultFilters, ...filters };
  }

  /**
   * Get new query
   */
  public newQuery() {
    return (this.model as any).aggregate() as ModelAggregate<T>;
  }

  /**
   * An alias to newQuery
   */
  public get query() {
    return (this.model as any).aggregate() as ModelAggregate<T>;
  }

  /**
   * Get cached model
   */
  public async getCachedModel(id: number) {
    return this.getCachedModelBy("id", Number(id));
  }

  /**
   * Get cached model by the given column
   */
  public async getCachedModelBy(
    column: string,
    value: any,
    cacheKeyOptions?: GenericObject,
  ) {
    const cacheKey = this.cacheKey(
      "data." + column + "." + value,
      cacheKeyOptions,
    );

    const cachedModel = await this.cacheDriver.get(cacheKey);

    if (cachedModel) {
      return cachedModel;
    }

    const model = await this.findBy(column, value);

    if (!model) return null;

    this.cache(cacheKey, await model);

    return model;
  }

  /**
   * Get cached model data
   */
  public async getCached(id: string | number) {
    return this.getCachedBy("id", Number(id));
  }

  /**
   * Get active cached model
   */
  public async getActiveCached(id: string | number) {
    const model = await this.getCached(id);

    if (!model) return null;

    if (model.get("isActive") !== true) return null;

    return model;
  }

  /**
   * Generate cache key
   */
  public cacheKey(key: string, moreOptions?: GenericObject) {
    let cacheKey = "repositories." + this.model.collection;

    if (key) {
      cacheKey += "." + key;
    }

    if (moreOptions) {
      cacheKey += "." + JSON.stringify(moreOptions);
    }

    return cacheKey;
  }

  /**
   * Get cached data by the given column
   */
  public async getCachedBy(
    column: string,
    value: any,
    cacheKeyOptions?: GenericObject,
  ) {
    const { request } = requestContext() || {};

    const localeCode = request.locale ? `locale.${request.locale}.` : "";

    const cacheKey = this.cacheKey(
      `data.${localeCode}${column}.${value}`,
      cacheKeyOptions,
    );

    const cachedModel = await this.cacheDriver.get(cacheKey);

    if (cachedModel) {
      return this.newModel(cachedModel);
    }

    const model = await this.findBy(column, value);

    if (!model) return null;

    this.cache(cacheKey, model.data);

    return model;
  }

  /**
   * Get and cached value by id then purge it from cache
   */
  public async getCachedPurge(id: number) {
    return this.getCachedByPurge("id", Number(id));
  }

  /**
   * Get and cached by the given column then purge it from cache
   */
  public async getCachedByPurge(column: string, value: any) {
    const model = await this.getCachedBy(column, value);

    if (!model) return null;

    this.clearCache();

    return model;
  }

  /**
   * List records
   */
  public async list(options?: RepositoryOptions) {
    const repositoryListing = this.newList(options);

    await repositoryListing.list();

    return {
      documents: repositoryListing.documents as T[],
      paginationInfo: repositoryListing.paginationInfo,
    };
  }

  /**
   * Find latest records
   */
  public async latest(options?: RepositoryOptions) {
    return await this.list({
      ...options,
      orderBy: ["id", "desc"],
    });
  }

  /**
   * Get latest and active records
   */
  public async latestActive(options?: RepositoryOptions) {
    return await this.list({
      isActive: true,
      ...options,
      orderBy: ["id", "desc"],
    });
  }

  /**
   * Get oldest records
   */
  public async oldest(options?: RepositoryOptions) {
    return await this.list({
      ...options,
      orderBy: ["id", "asc"],
    });
  }

  /**
   * Get oldest and active records
   */
  public async oldestActive(options?: RepositoryOptions) {
    return await this.list({
      isActive: true,
      ...options,
      orderBy: ["id", "asc"],
    });
  }

  /**
   * List cached records
   */
  public async listCached(options: CachedRepositoryOptions = {}) {
    if (options.cacheCurrentLocale !== false) {
      const localeCode = requestContext()?.request?.locale;

      if (localeCode) {
        if (!options) {
          options = {};
        }

        options.locale = localeCode;
      }
    }

    return this.cacheList({
      options,
      purge: options.purgeCache,
    });
  }

  /**
   * Fetch cached records or cache new ones
   */
  public async cacheList({
    key = "list",
    options,
    purge,
    expiresAfter,
  }: {
    key?: string;
    purge?: boolean;
    expiresAfter?: number;
    options?: CachedRepositoryOptions;
  }) {
    if (!this.isCacheable) return this.list(options);

    // generate cache key for the list method
    const cacheKey = this.cacheKey(key, options);

    // check if the data is already cached
    const listing = await this.cacheDriver.get(cacheKey);

    if (listing) {
      if (purge) {
        this.cacheDriver.remove(cacheKey);
      }
      return {
        documents: this.mapModels(listing.documents),
        paginationInfo: listing.paginationInfo,
      } as {
        documents: T[];
        paginationInfo: PaginationListing<T>["paginationInfo"];
      };
    }

    // if we reached here then the data is not cached yet, so we need to fetch it from database first
    const { documents, paginationInfo } = await this.list(options);

    if (!purge) {
      const cachedDocuments = documents.map(document => document.data);
      // cache the data
      // please note that models can not be serialized, thus we need to store only the document data itself
      this.cacheDriver.set(
        cacheKey,
        {
          documents: cachedDocuments,
          paginationInfo,
        },
        expiresAfter,
      );
    }

    return {
      documents: documents,
      paginationInfo: paginationInfo,
    };
  }

  /**
   * Fetch cached records or cache new ones
   */
  public async cacheAll({
    key = "all",
    options,
    expiresAfter,
    purge,
  }: {
    key?: string;
    purge?: boolean;
    expiresAfter?: number;
    options?: CachedRepositoryOptions;
  }) {
    // generate cache key for the list method
    const cacheKey = this.cacheKey(key, options);

    // check if the data is already cached
    const listing = await this.cacheDriver.get(cacheKey);

    if (listing) {
      if (purge) {
        this.cacheDriver.remove(cacheKey);
      }
      return this.mapModels(listing.documents) as T[];
    }

    // if we reached here then the data is not cached yet, so we need to fetch it from database first
    const documents = await this.all(options);

    if (!purge) {
      const cachedDocuments = documents.map(document => document.data);
      // cache the data
      // please note that models can not be serialized, thus we need to store only the document data itself
      this.cacheDriver.set(cacheKey, cachedDocuments, expiresAfter);
    }

    return documents;
  }

  /**
   * Get new repository listing instance
   */
  public newList(options?: RepositoryOptions) {
    if (!this.filterBy.id) {
      this.filterBy.id = "int";
    }

    const listing = new RepositoryListing<T, M>(this as any, this.filterBy, {
      ...this.defaultOptions,
      ...(options || {}),
    });

    if (this.dateFormat) {
      listing.setDateFormat(this.dateFormat);
    }

    if (this.dateTimeFormat) {
      listing.setDateTimeFormat(this.dateTimeFormat);
    }

    return listing;
  }

  /**
   * Map the given documents into models
   */
  public mapModels(documents: any[]) {
    return documents.map(document => this.newModel(document));
  }

  /**
   * Count total records based on the given options
   */
  public async count(options: RepositoryOptions = {}) {
    const repositoryListing = this.newList(options);

    return await repositoryListing.count();
  }

  /**
   * Count total active records
   */
  public async countActive(options: RepositoryOptions = {}) {
    return await this.count({
      isActive: true,
      ...options,
    });
  }

  /**
   * Get total records based on the given options and cache it
   */
  public async countCached(options: RepositoryOptions = {}) {
    const localeCode = requestContext()?.request?.locale;

    if (localeCode) {
      if (!options) {
        options = {};
      }

      options.locale = localeCode;
    }

    const cacheKey = this.cacheKey("count", options);

    let count = await this.cacheDriver.get(cacheKey);

    if (options?.purgeCache) {
      this.cacheDriver.remove(cacheKey);
    }

    if (count !== undefined) {
      return count;
    }

    count = await this.count(options);

    if (!options.purgeCache) {
      this.cache(cacheKey, count);
    }

    return count;
  }

  /**
   * Count active records and cache it
   */
  public async countActiveCached(options: RepositoryOptions = {}) {
    return await this.countCached({
      isActive: true,
      ...options,
    });
  }

  /**
   * Cache the given key and value
   */
  protected async cache(key: string, value: any) {
    return await this.cacheDriver.set(key, value);
  }

  /**
   * List active cached records
   */
  public async listActiveCached(options: CachedRepositoryOptions = {}) {
    return this.listCached({
      isActive: true,
      ...options,
    });
  }

  /**
   * List active records
   */
  public async listActive(options: RepositoryOptions = {}) {
    return this.list({
      isActive: true,
      ...options,
    });
  }

  /**
   * Chunk records
   */
  public async chunk(
    options: RepositoryOptions,
    callback: (
      documents: T[],
      paginationInfo: PaginationListing<T>["paginationInfo"],
    ) => Promise<false | any>,
  ) {
    //
    if (
      !options.limit &&
      !this.defaultOptions.defaultLimit &&
      !this.defaultOptions.limit
    ) {
      throw new Error(
        "limit is missing in the chunk method, please pass it to the options or define it in this.options object",
      );
    }

    const query = this.newList(options);

    return await query.chunk(callback);
  }

  /**
   * Chunk active records
   */
  public async chunkActive(
    options: RepositoryOptions,
    callback: (
      documents: T[],
      paginationInfo: PaginationListing<T>["paginationInfo"],
    ) => Promise<false | any>,
  ) {
    return await this.chunk(
      {
        isActive: true,
        ...options,
      },
      callback,
    );
  }

  /**
   * Get active record
   */
  public async getActive(id: number | string, options: RepositoryOptions = {}) {
    return this.first({
      isActive: true,
      perform(query) {
        query.where("id", Number(id));
      },
      ...options,
    });
  }

  /**
   * Get single record by id
   */
  public async get(id: number, options: RepositoryOptions = {}) {
    return this.first({
      perform(query) {
        query.where("id", Number(id));
      },
      ...options,
    });
  }

  /**
   * Get owned record
   */
  public async getOwned(userId: number, id: number, column = "createdBy") {
    return await this.first({
      perform(query) {
        query.where({
          id: Number(id),
          [`${column}.id`]: userId,
        });
      },
    });
  }

  /**
   * Get owned records
   */
  public async listOwned(
    userId: number,
    options: RepositoryOptions = {},
    column = "createdBy",
  ) {
    return await this.list({
      ...options,
      perform(query) {
        query.where(`${column}.id`, Number(userId));
      },
    });
  }

  /**
   * Get owned active records
   */
  public async listOwnedActive(
    userId: number,
    options: RepositoryOptions = {},
    column = "createdBy",
  ) {
    return await this.list({
      ...options,
      isActive: true,
      perform(query) {
        query.where(`${column}.id`, userId);
      },
    });
  }

  /**
   * Get first record
   */
  public async first(options?: RepositoryOptions) {
    const { documents } = await this.list({
      orderBy: ["id", "asc"],
      ...options,
      limit: 1,
    });

    return documents[0] ?? null;
  }

  /**
   * Get first cached record
   */
  public async firstCached(options?: RepositoryOptions) {
    const { documents } = await this.listCached({
      orderBy: ["id", "asc"],
      ...options,
      limit: 1,
    });

    return documents[0] ?? null;
  }

  /**
   * Get first active record
   */
  public async firstActive(options?: RepositoryOptions) {
    const { documents } = await this.list({
      orderBy: ["id", "asc"],
      isActive: true,
      ...options,
      limit: 1,
    });

    return documents[0] ?? null;
  }

  /**
   * Get first active cached record
   */
  public async firstActiveCached(options?: RepositoryOptions) {
    const { documents } = await this.listCached({
      orderBy: ["id", "asc"],
      isActive: true,
      ...options,
      limit: 1,
    });

    return documents[0] ?? null;
  }

  /**
   * Get last record
   */
  public async last(options?: RepositoryOptions) {
    const { documents } = await this.list({
      orderBy: ["id", "desc"],
      ...options,
      limit: 1,
    });

    return documents[0];
  }

  /**
   * Get last cached record
   */
  public async lastCached(options?: RepositoryOptions) {
    const { documents } = await this.listCached({
      orderBy: ["id", "desc"],
      ...options,
      limit: 1,
    });

    return documents[0];
  }

  /**
   * Get last active record
   */
  public async lastActive(options?: RepositoryOptions) {
    const { documents } = await this.list({
      orderBy: ["id", "desc"],
      isActive: true,
      ...options,
      limit: 1,
    });

    return documents[0];
  }

  /**
   * Get last active cached record
   */
  public async lastActiveCached(options?: RepositoryOptions) {
    const { documents } = await this.listCached({
      orderBy: ["id", "desc"],
      isActive: true,
      ...options,
      limit: 1,
    });

    return documents[0];
  }

  /**
   * Make filter
   */
  public async filter(_query: ModelAggregate<T>, _options: RepositoryOptions) {
    //
  }

  /**
   * {@inheritdoc}
   */
  public orderBy(_options: RepositoryOptions): any {
    //
  }

  /**
   * Find By id
   */
  public async find(id: string | number | T) {
    if (this.model && id instanceof this.model) return id as T;

    return await this.findBy("id", Number(id));
  }

  /**
   * Find active document
   */
  public async findActive(id: string | number | T) {
    if (this.model && id instanceof this.model) return id as T;

    return await this.findBy("id", Number(id));
  }

  /**
   * Find by the given column
   */
  public async findBy(column: string, value: any) {
    return this.first({
      perform(query) {
        query.where(column, value);
      },
    });
  }

  /**
   * Find by the given column and make sure it is active
   */
  public async findByActive(column: string, value: any) {
    return this.first({
      perform(query) {
        query.where({
          isActive: true,
          [column]: value,
        });
      },
    });
  }

  /**
   * Find by the given column and cache it
   * @alias getCached
   */
  public async findCached(id: number | string | T) {
    if (id instanceof Model) return id;

    return await this.getCached(id);
  }

  /**
   * Find by the given column and cache it
   * @alias getCachedBy
   */
  public async findByCached(column: string, value: any) {
    return await this.getCachedBy(column, value);
  }
}
