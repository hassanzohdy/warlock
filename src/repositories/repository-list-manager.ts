import { Model, ModelAggregate } from "@mongez/mongodb";
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
   * List records
   */
  public async list(options?: RepositoryOptions) {
    const repositoryListing = this.newListing(options);

    await repositoryListing.list();

    if (repositoryListing.hasPagination()) {
      return {
        documents: repositoryListing.documents,
        paginationInfo: repositoryListing.paginationInfo,
      };
    }

    return {
      documents: repositoryListing.documents,
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
  public async getActive(id: number, options: RepositoryOptions = {}) {
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
   * Get owned record
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
  public async find(id: string | number | T): Promise<null | T> {
    if (id instanceof this.model) return id as T;

    return await this.findBy("id", Number(id));
  }

  /**
   * Find by the given column
   */
  public async findBy(column: string, value: any): Promise<null | T> {
    return await (this.model as any).findBy(column, value);
  }
}
