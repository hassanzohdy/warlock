import {
  Model,
  ModelAggregate,
  PaginationListing,
  toOperator,
  WhereOperator,
  whereOperators,
} from "@mongez/mongodb";
import { get } from "@mongez/reinforcements";
import dayjs from "dayjs";
import { BaseRepositoryManager } from "./base-repository-manager";
import { FilterByOptions, FilterByType, RepositoryOptions } from "./types";
import { defaultRepositoryOptions } from "./utils";

const Missing = Symbol("Missing");

export abstract class RepositoryListManager<
  T extends Model,
  M extends typeof Model = typeof Model
> extends BaseRepositoryManager<T, M> {
  /**
   * Aggregate query
   */
  protected query!: ModelAggregate<T>;

  /**
   * List default options
   */
  protected defaultOptions: RepositoryOptions = { ...defaultRepositoryOptions };

  /**
   * List options
   */
  protected options: RepositoryOptions = {};

  /**
   * Pagination info
   *
   * Returned when the list is paginated
   */
  public paginationInfo?: PaginationListing<T>["paginationInfo"];

  /**
   * Filter By options
   */
  protected filterBy: FilterByOptions = {};

  /**
   * Before listing
   * Called before listing records
   */
  protected async beforeListing() {
    // override this method
  }

  /**
   * On list
   * Called after listing records
   */
  protected async onList(records: T[]): Promise<T[]> {
    return records;
  }

  /**
   * Merge default options with the given options
   */
  protected withDefaultOptions(options: RepositoryOptions) {
    return { ...this.defaultOptions, ...options };
  }

  /**
   * Get new query
   */
  protected newQuery() {
    return (this.model as any).aggregate() as ModelAggregate<T>;
  }

  /**
   * List records
   */
  public async list(options?: RepositoryOptions) {
    this.prepareOptions(options);

    this.query = this.newQuery();

    await this.beforeListing();

    await this.parseFilterBy();

    this.filter();

    this.orderBy();

    if (this.options.select) {
      this.query.select(this.options.select);
    }

    if (this.options.perform) {
      this.options.perform(this.query);
    }

    let records: T[] = [];

    const paginate = this.options.paginate;

    const limit = this.options.limit;

    if (paginate) {
      const { documents, paginationInfo } = await this.query.paginate(
        Number(this.options.page || 1),
        Number(limit)
      );

      records = documents;

      this.paginationInfo = paginationInfo;
    } else {
      if (limit && options?.limit) {
        this.query.limit(limit);
      }

      records = await this.query.get();
    }

    records = await this.onList(records);

    return records;
  }

  /**
   * Count total records based on the given options
   */
  public async count(options: RepositoryOptions = {}) {
    this.prepareOptions(options);

    const Model = this.model;

    this.query = (Model as any).aggregate();

    if (!this.query) return [];

    await this.beforeListing();

    this.parseFilterBy();

    this.filter();

    this.orderBy();

    return await this.query.count();
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
    column = "createdBy"
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
    const records = await this.list({
      orderBy: ["id", "asc"],
      ...options,
      limit: 1,
    });

    return records[0] ?? null;
  }

  /**
   * Get last record
   */
  public async last(options?: RepositoryOptions) {
    const records = await this.list({
      orderBy: ["id", "desc"],
      ...options,
      limit: 1,
    });

    return records[0];
  }

  /**
   * Prepare options
   */
  protected prepareOptions(options: RepositoryOptions = {}) {
    this.paginationInfo = undefined;
    this.options = {
      ...this.defaultOptions,
      ...options,
    };
  }

  /**
   * Parse filter by
   */
  protected async parseFilterBy() {
    // get where operators from WhereOperator type
    for (const optionKey in this.filterBy) {
      const filterValue = this.option(optionKey);
      if (filterValue === undefined) continue;

      const { filterType, columns, column } = this.prepareFilterType(
        optionKey,
        this.filterBy[optionKey]
      );

      if (typeof filterType === "function") {
        await filterType(filterValue, this.query);
        continue;
      }

      // where operators
      if (whereOperators.includes(filterType as WhereOperator)) {
        if (column) {
          this.query.where(column, filterType as WhereOperator, filterValue);
        } else if (columns) {
          const columnsAsObject: any = {};

          for (const column of columns) {
            columnsAsObject[column] = {
              [toOperator(filterType as WhereOperator)]: filterValue,
            };
          }

          this.query.orWhere(columnsAsObject);
        }

        continue;
      }

      // bool, boolean
      if (["bool", "boolean"].includes(filterType)) {
        const value = filterValue === "0" ? false : Boolean(filterValue);
        if (column) {
          this.query.where(column, value);
        } else if (columns) {
          const columnsAsObject: any = {};

          for (const column of columns) {
            columnsAsObject[column] = value;
          }

          this.query.orWhere(columnsAsObject);
        }
        continue;
      }

      // !int
      if (filterType === "!int") {
        if (column) {
          this.query.where(column, "!=", parseInt(filterValue));
        } else if (columns) {
          const columnsAsObject: any = {};

          for (const column of columns) {
            columnsAsObject[column] = {
              $ne: parseInt(filterValue),
            };
          }

          this.query.orWhere(columnsAsObject);
        }
        continue;
      }

      // int, integer

      if (["int", "integer"].includes(filterType)) {
        if (column) {
          this.query.where(column, parseInt(filterValue));
        } else if (columns) {
          const columnsAsObject: any = {};

          for (const column of columns) {
            columnsAsObject[column] = parseInt(filterValue);
          }

          this.query.orWhere(columnsAsObject);
        }
        continue;
      }

      // inInt
      if (filterType === "inInt") {
        const value = Array(filterValue).map((v: any) => parseInt(v));
        if (column) {
          this.query.whereIn(column, value);
        } else if (columns) {
          const columnsAsObject: any = {};

          for (const column of columns) {
            columnsAsObject[column] = {
              $in: value,
            };
          }

          this.query.orWhere(columnsAsObject);
        }
        continue;
      }

      // number

      if (filterType === "number") {
        if (column) {
          this.query.where(column, Number(filterValue));
        } else if (columns) {
          const columnsAsObject: any = {};

          for (const column of columns) {
            columnsAsObject[column] = Number(filterValue);
          }

          this.query.orWhere(columnsAsObject);
        }
        continue;
      }

      // inNumber
      if (filterType === "inNumber") {
        const value = Array(filterValue).map((v: any) => Number(v));
        if (column) {
          this.query.whereIn(column, value);
        } else if (columns) {
          const columnsAsObject: any = {};

          for (const column of columns) {
            columnsAsObject[column] = {
              $in: value,
            };
          }

          this.query.orWhere(columnsAsObject);
        }

        continue;
      }

      // float, double
      if (["float", "double"].includes(filterType)) {
        const value = Array(filterValue).map((v: any) => parseFloat(v));
        if (column) {
          this.query.whereIn(column, value);
        } else if (columns) {
          const columnsAsObject: any = {};

          for (const column of columns) {
            columnsAsObject[column] = {
              $in: value,
            };
          }

          this.query.orWhere(columnsAsObject);
        }

        continue;
      }

      // date

      if (filterType === "date") {
        const value = this.parseDate(filterValue);
        if (column) {
          this.query.where(column, value);
        } else if (columns) {
          const columnsAsObject: any = {};

          for (const column of columns) {
            columnsAsObject[column] = value;
          }

          this.query.orWhere(columnsAsObject);
        }

        continue;
      }

      // date>

      if (filterType === "date>") {
        const value = this.parseDate(filterValue);
        if (column) {
          this.query.where(column, ">", value);
        } else if (columns) {
          const columnsAsObject: any = {};

          for (const column of columns) {
            columnsAsObject[column] = {
              $gt: value,
            };
          }

          this.query.orWhere(columnsAsObject);
        }

        continue;
      }

      // date>=
      if (filterType === "date>=") {
        const value = this.parseDate(filterValue);
        if (column) {
          this.query.where(column, ">=", value);
        } else if (columns) {
          const columnsAsObject: any = {};

          for (const column of columns) {
            columnsAsObject[column] = {
              $gte: value,
            };
          }

          this.query.orWhere(columnsAsObject);
        }

        continue;
      }

      // date<

      if (filterType === "date<") {
        const value = this.parseDate(filterValue);
        if (column) {
          this.query.where(column, "<", value);
        } else if (columns) {
          const columnsAsObject: any = {};

          for (const column of columns) {
            columnsAsObject[column] = {
              $gte: value,
            };
          }

          this.query.orWhere(columnsAsObject);
        }

        continue;
      }

      // date<=
      if (filterType === "date<=") {
        const value = this.parseDate(filterValue);
        if (column) {
          this.query.where(column, "<=", value);
        } else if (columns) {
          const columnsAsObject: any = {};

          for (const column of columns) {
            columnsAsObject[column] = {
              $gte: value,
            };
          }

          this.query.orWhere(columnsAsObject);
        }

        continue;
      }

      // inDate

      if (filterType === "inDate") {
        const value = Array(filterValue).map((v: any) => this.parseDate(v));
        if (column) {
          this.query.whereIn(column, value);
        } else if (columns) {
          const columnsAsObject: any = {};

          for (const column of columns) {
            columnsAsObject[column] = {
              $in: value,
            };
          }

          this.query.orWhere(columnsAsObject);
        }

        continue;
      }

      // dateBetween

      if (filterType === "dateBetween") {
        const value: any = Array(filterValue).map((v: any) =>
          this.parseDate(v)
        );

        if (column) {
          this.query.whereBetween(column, value);
        } else if (columns) {
          const columnsAsObject: any = {};

          for (const column of columns) {
            columnsAsObject[column] = {
              $between: value,
            };
          }

          this.query.orWhere(columnsAsObject);
        }

        continue;
      }

      // dateTime

      if (filterType === "dateTime") {
        const value = this.parseDate(filterValue, this.dateTimeFormat);
        if (column) {
          this.query.where(column, value);
        } else if (columns) {
          const columnsAsObject: any = {};

          for (const column of columns) {
            columnsAsObject[column] = value;
          }

          this.query.orWhere(columnsAsObject);
        }

        continue;
      }

      // dateTime>

      if (filterType === "dateTime>") {
        const value = this.parseDate(filterValue, this.dateTimeFormat);
        if (column) {
          this.query.where(column, ">", value);
        } else if (columns) {
          const columnsAsObject: any = {};

          for (const column of columns) {
            columnsAsObject[column] = {
              $gt: value,
            };
          }

          this.query.orWhere(columnsAsObject);
        }

        continue;
      }

      // dateTime>=

      if (filterType === "dateTime>=") {
        const value = this.parseDate(filterValue, this.dateTimeFormat);
        if (column) {
          this.query.where(column, ">=", value);
        } else if (columns) {
          const columnsAsObject: any = {};

          for (const column of columns) {
            columnsAsObject[column] = {
              $gte: value,
            };
          }

          this.query.orWhere(columnsAsObject);
        }

        continue;
      }

      // dateTime<

      if (filterType === "dateTime<") {
        const value = this.parseDate(filterValue, this.dateTimeFormat);
        if (column) {
          this.query.where(column, "<", value);
        } else if (columns) {
          const columnsAsObject: any = {};

          for (const column of columns) {
            columnsAsObject[column] = {
              $gte: value,
            };
          }

          this.query.orWhere(columnsAsObject);
        }

        continue;
      }

      // dateTime<=

      if (filterType === "dateTime<=") {
        const value = this.parseDate(filterValue, this.dateTimeFormat);
        if (column) {
          this.query.where(column, "<=", value);
        } else if (columns) {
          const columnsAsObject: any = {};

          for (const column of columns) {
            columnsAsObject[column] = {
              $gte: value,
            };
          }

          this.query.orWhere(columnsAsObject);
        }

        continue;
      }

      // inDateTime

      if (filterType === "inDateTime") {
        const value = Array(filterValue).map((v: any) =>
          this.parseDate(v, this.dateTimeFormat)
        );
        if (column) {
          this.query.whereIn(column, value);
        } else if (columns) {
          const columnsAsObject: any = {};

          for (const column of columns) {
            columnsAsObject[column] = {
              $in: value,
            };
          }

          this.query.orWhere(columnsAsObject);
        }

        continue;
      }

      // dateTimeBetween

      if (filterType === "dateTimeBetween") {
        const value: any = Array(filterValue).map((v: any) =>
          this.parseDate(v, this.dateTimeFormat)
        );

        if (column) {
          this.query.whereBetween(column, value);
        } else if (columns) {
          const columnsAsObject: any = {};

          for (const column of columns) {
            columnsAsObject[column] = {
              $between: value,
            };
          }

          this.query.orWhere(columnsAsObject);
        }

        continue;
      }
    }
  }

  /**
   * Prepare filter type
   */
  protected prepareFilterType(optionKey: string, filterType: FilterByType) {
    if (Array.isArray(filterType)) {
      if (filterType.length === 1) {
        return {
          filterType: filterType[0],
          column: optionKey,
          columns: undefined,
        } as const;
      }

      if (Array.isArray(filterType[1])) {
        return {
          filterType: filterType[0],
          column: undefined,
          columns: filterType[1],
        } as const;
      } else {
        return {
          filterType: filterType[0],
          column: filterType[1],
          columns: undefined,
        } as const;
      }
    }

    return {
      filterType,
      column: optionKey,
      columns: undefined,
    };
  }

  /**
   * Parse date value
   */
  protected parseDate(value: any, format = this.dateFormat) {
    if (value instanceof Date) return value;

    if (typeof value === "string") {
      return dayjs(value, format);
    }

    return value;
  }

  /**
   * Get option's value for the given key
   */
  protected option(key: string, defaultValue: any = Missing) {
    const value = get(this.options, key, defaultValue);

    return value === Missing ? undefined : value;
  }

  /**
   * Make filter
   */
  protected filter() {
    //
  }

  /**
   * Make order by
   */
  protected orderBy() {
    if (!this.options.orderBy) return;

    const orderBy = this.options.orderBy;

    if (Array.isArray(orderBy)) {
      const [column, direction] = orderBy;
      this.query.orderBy(column, direction);
      return;
    }

    this.query.sortBy(orderBy);
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
