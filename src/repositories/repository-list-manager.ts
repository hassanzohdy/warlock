import { Model, ModelAggregate, PaginationListing } from "@mongez/monpulse";
import { GenericObject } from "@mongez/reinforcements";
import Is from "@mongez/supportive-is";
import { cache } from "../cache";
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
    createdAt: "date",
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
  protected cacheDriver = cache;

  /**
   * Constructor
   */
  public constructor() {
    super();
    this.prepareCache();
  }

  /**
   * Prepare  cache
   */
  public prepareCache() {
    if (!this.cacheDriver.exists || !this.isCacheable) return;

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
    const cacheKey = this.generateCacheKey(`id.${model.id}`);

    await this.cache(cacheKey, model.data);
  }

  /**
   * Clear the entire cache
   */
  public async clearCache() {
    await this.cacheDriver.removeByNamespace(this.model.collection);
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
    const cacheKey = this.generateCacheKey(
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
  protected generateCacheKey(key: string, moreOptions: GenericObject = {}) {
    return (
      this.model.collection +
      "." +
      key +
      (!Is.empty(moreOptions) ? "." + JSON.stringify(moreOptions) : "")
    );
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

    const cacheKey = this.generateCacheKey(
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
    const repositoryListing = this.newListing(options);

    await repositoryListing.list();

    return {
      documents: repositoryListing.documents as T[],
      paginationInfo: repositoryListing.paginationInfo,
    };
  }

  /**
   * List cached records
   */
  public async listCached(options: CachedRepositoryOptions = {}) {
    if (!this.isCacheable) return this.list(options);

    if (options.cacheCurrentLocale !== false) {
      const localeCode = requestContext()?.request?.locale;

      if (localeCode) {
        if (!options) {
          options = {};
        }

        options.locale = localeCode;
      }
    }

    const cacheKey = this.generateCacheKey("list", options);

    const listing = await this.cacheDriver.get(cacheKey);

    if (options?.purgeCache) {
      this.cacheDriver.remove(cacheKey);
    }

    if (listing) {
      return {
        documents: listing.map((document: any) => this.newModel(document)),
        paginationInfo: listing.paginationInfo,
      } as {
        documents: T[];
        paginationInfo: PaginationListing<T>["paginationInfo"];
      };
    }

    const { documents, paginationInfo } = await this.list(options);

    if (!options.purgeCache) {
      const cachedDocuments = documents.map(document => document.data);
      this.cache(cacheKey, {
        documents: cachedDocuments,
        paginationInfo,
      });
    }

    return {
      documents: documents,
      paginationInfo: paginationInfo,
    };
  }

  /**
   * Get new repository listing instance
   */
  public newListing(options?: RepositoryOptions) {
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
   * Count total records based on the given options
   */
  public async count(options: RepositoryOptions = {}) {
    const repositoryListing = this.newListing(options);

    return await repositoryListing.count();
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

    const cacheKey = this.generateCacheKey("count", options);

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
   * Cache the given key and value
   */
  protected async cache(key: string, value: any) {
    if (!this.cacheDriver.exists || !this.isCacheable) return;

    return await this.cacheDriver.set(key, value);
  }

  /**
   * List active cached records
   */
  public async listActiveCached(options: CachedRepositoryOptions = {}) {
    return this.listCached({
      ...options,
      isActive: true,
    });
  }

  /**
   * List active records
   */
  public async listActive(options: RepositoryOptions = {}) {
    return this.list({
      ...options,
      isActive: true,
    });
  }

  /**
   * Get active record
   */
  public async getActive(id: number | string, options: RepositoryOptions = {}) {
    return this.first({
      id,
      ...options,
      isActive: true,
    });
  }

  /**
   * Get single record by id
   */
  public async get(id: number, options: RepositoryOptions = {}) {
    return this.first({
      id,
      ...options,
    });
  }

  /**
   * Get owned record
   */
  public async getOwned(userId: number, id: number, column = "createdBy") {
    const record = await this.find(id);

    if (!record) return null;

    if (record.get(`${column}.id`) !== userId) return null;

    return record;
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
        query.where(`${column}.id`, userId);
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
      ...options,
      limit: 1,
      isActive: true,
    });

    return documents[0] ?? null;
  }

  /**
   * Get first active cached record
   */
  public async firstActiveCached(options?: RepositoryOptions) {
    const { documents } = await this.listCached({
      orderBy: ["id", "asc"],
      ...options,
      limit: 1,
      isActive: true,
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
      ...options,
      limit: 1,
      isActive: true,
    });

    return documents[0];
  }

  /**
   * Get last active cached record
   */
  public async lastActiveCached(options?: RepositoryOptions) {
    const { documents } = await this.listCached({
      orderBy: ["id", "desc"],
      ...options,
      limit: 1,
      isActive: true,
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
    if (id instanceof this.model) return id as T;

    return await this.findBy("id", Number(id));
  }

  /**
   * Find by the given column
   */
  public async findBy(column: string, value: any): Promise<null | T> {
    return await (this.model as any).findBy(column, value);
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
  public async findByCached(column: string, value: any): Promise<null | T> {
    return await this.getCachedBy(column, value);
  }
}
