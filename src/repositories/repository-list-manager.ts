import { Model, ModelAggregate } from "@mongez/mongodb";
import { GenericObject } from "@mongez/reinforcements";
import Is from "@mongez/supportive-is";
import { cache } from "../cache";
import { requestContext } from "../http/middleware/inject-request-context";
import { BaseRepositoryManager } from "./base-repository-manager";
import { RepositoryListing } from "./repository-listing";
import { FilterByOptions, RepositoryOptions } from "./types";
import { defaultRepositoryOptions } from "./utils";

export abstract class RepositoryListManager<
  T extends Model,
  M extends typeof Model = typeof Model,
> extends BaseRepositoryManager<T, M> {
  /**
   * List default options
   */
  protected defaultOptions: RepositoryOptions = { ...defaultRepositoryOptions };

  /**
   * Filter By options
   */
  protected filterBy: FilterByOptions = {};

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
  protected prepareCache() {
    setTimeout(() => {
      this.model
        .events()
        .onSaved(async model => {
          await this.clearCache();
          await this.cacheModel(model);
        })
        .onDeleted(() => {
          this.clearCache();
        });
    }, 0);
  }

  /**
   * Cache the given model
   */
  public async cacheModel(model: T) {
    const cacheKey = this.generateCacheKey(`id.${model.id}`);

    await cache.set(cacheKey, model.data);
  }

  /**
   * Clear the entire cache
   */
  public async clearCache() {
    await cache.removeByNamespace(this.model.collection);
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

    const cachedModel = await cache.get(cacheKey);

    if (cachedModel) {
      return cachedModel;
    }

    const model = await this.findBy(column, value);

    if (!model) return null;

    cache.set(cacheKey, await model);

    return model;
  }

  /**
   * Get cached model data
   */
  public async getCached(id: string | number) {
    return this.getCachedBy("id", Number(id));
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
    const { request } = requestContext();

    const localeCode = request.locale ? `locale.${request.locale.code}.` : "";

    const cacheKey = this.generateCacheKey(
      `data.${localeCode}${column}.${value}`,
      cacheKeyOptions,
    );

    const cachedModel = await cache.get(cacheKey);

    if (cachedModel) {
      return cachedModel;
    }

    const model = await this.findBy(column, value);

    if (!model) return null;

    cache.set(cacheKey, await model.toJSON());

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
  public async listCached(options: RepositoryOptions = {}) {
    const localeCode = requestContext().request.locale;

    if (localeCode) {
      if (!options) {
        options = {};
      }

      options.locale = localeCode;
    }

    const cacheKey = this.generateCacheKey("list", options);

    const listing = await cache.get(cacheKey);

    if (options?.purgeCache) {
      cache.remove(cacheKey);
    }

    if (listing) {
      return {
        paginationInfo: listing.paginationInfo,
        documents: listing.documents,
      };
    }

    const { documents, paginationInfo } = await this.list(options);

    if (!options?.purgeCache) {
      cache.set(cacheKey, {
        documents: await Promise.all(
          documents.map(async document => document.toJSON()),
        ),
        paginationInfo: paginationInfo,
      });
    }

    return {
      documents,
      paginationInfo,
    };
  }

  /**
   * Get new repository listing instance
   */
  public newListing(options?: RepositoryOptions) {
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
    const localeCode = requestContext().request.locale;

    if (localeCode) {
      if (!options) {
        options = {};
      }

      options.locale = localeCode;
    }

    const cacheKey = this.generateCacheKey("count", options);

    let count = await cache.get(cacheKey);

    if (options?.purgeCache) {
      cache.remove(cacheKey);
    }

    if (count !== undefined) {
      return count;
    }

    count = await this.count(options);

    if (!options.purgeCache) {
      cache.set(cacheKey, count);
    }

    return count;
  }

  /**
   * List active cached records
   */
  public async listActiveCached(options: RepositoryOptions = {}) {
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
    const record = await this.first({
      id,
    });

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
