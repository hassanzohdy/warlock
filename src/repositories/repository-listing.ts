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
import { RepositoryManager } from "./repository-manager";
import { FilterByOptions, FilterByType, RepositoryOptions } from "./types";

export class RepositoryListing<
  T extends Model,
  M extends typeof Model = typeof Model,
> {
  /**
   * Aggregate query
   */
  protected query!: ModelAggregate<T>;

  /**
   * Pagination info
   *
   * Returned when the list is paginated
   */
  public paginationInfo?: PaginationListing<T>["paginationInfo"];

  /**
   * List options
   */
  protected options: RepositoryOptions = {};

  /**
   * Documents list from the query
   */
  public documents: T[] = [];

  /**
   * Date time format
   */
  protected dateTimeFormat = "";

  /**
   * Date format
   */
  protected dateFormat = "";

  /**
   * Constructor
   */
  public constructor(
    protected repositoryManager: RepositoryManager<T, M>,
    protected filterBy: FilterByOptions = {},
    options?: RepositoryOptions,
  ) {
    //
    this.prepareOptions(options);
  }

  /**
   * Set date time format
   */
  public setDateTimeFormat(format: string) {
    this.dateTimeFormat = format;

    return this;
  }

  /**
   * Set date format
   */
  public setDateFormat(format: string) {
    this.dateFormat = format;

    return this;
  }

  /**
   * perform listing
   */
  public async list() {
    this.query = this.repositoryManager.newQuery();

    await this.repositoryManager.beforeListing(this.query, this.options);

    await this.parseFilterBy();

    await this.repositoryManager.filter(this.query, this.options);

    let orderByOptions = this.repositoryManager.orderBy?.(this.options);

    if (!orderByOptions) {
      orderByOptions = this.options.orderBy;
    }

    this.parseOrderBy(orderByOptions);

    if (this.options.select) {
      this.query.select(this.options.select);
    }

    if (this.options.deselect) {
      this.query.deselect(this.options.deselect);
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
        Number(limit || this.options.defaultLimit),
      );

      records = documents;

      this.paginationInfo = paginationInfo;
    } else {
      if (limit) {
        this.query.limit(limit);
      }

      records = await this.query.get();
    }

    this.documents = await this.repositoryManager.onList(records);
  }

  /**
   * Count records only
   */
  public async count() {
    this.query = this.repositoryManager.newQuery();

    await this.repositoryManager.beforeListing(this.query, this.options);

    await this.parseFilterBy();

    await this.repositoryManager.filter(this.query, this.options);

    if (this.options.select) {
      this.query.select(this.options.select);
    }

    if (this.options.deselect) {
      this.query.deselect(this.options.deselect);
    }

    if (this.options.perform) {
      this.options.perform(this.query);
    }

    // NO need to order by when counting

    return await this.query.count();
  }

  /**
   * Check if the list method Has pagination
   */
  public hasPagination() {
    return Boolean(this.paginationInfo);
  }

  /**
   * Int filter
   */
  protected intFilter(
    column: string | undefined,
    value: any,
    columns: string[] | undefined,
  ) {
    if (column) {
      this.query.where(column, parseInt(value));
    } else if (columns) {
      const columnsAsObject: any = {};

      for (const column of columns) {
        columnsAsObject[column] = parseInt(value);
      }

      this.query.orWhere(columnsAsObject);
    }
  }

  /**
   * float filter
   */
  protected floatFilter(
    column: string | undefined,
    value: any,
    columns: string[] | undefined,
  ) {
    if (column) {
      this.query.where(column, parseFloat(value));
    } else if (columns) {
      const columnsAsObject: any = {};

      for (const column of columns) {
        columnsAsObject[column] = parseFloat(value);
      }

      this.query.orWhere(columnsAsObject);
    }
  }

  /**
   * Where operators filter
   */
  protected whereOperatorsFilter(
    column: string | undefined,
    value: any,
    columns: string[] | undefined,
    filterType: WhereOperator,
  ) {
    if (column) {
      this.query.where(column, filterType as WhereOperator, value);
    } else if (columns) {
      const columnsAsObject: any = {};

      for (const column of columns) {
        columnsAsObject[column] = {
          [toOperator(filterType as WhereOperator)]: value,
        };
      }

      this.query.orWhere(columnsAsObject);
    }
  }

  /**
   * Parse filter by
   */
  protected async parseFilterBy() {
    // TODO: Use filter maps instead of these tons of if statements
    // get where operators from WhereOperator type
    // just get the keys
    // const filtersKeys = Object.keys(this.filterBy).filter(
    //   key => this.option(key) !== undefined,
    // );

    // for (const filterKey of filtersKeys) {
    //   const filterValue = this.option(filterKey);
    //   if (filterValue === undefined) continue;

    //   const { filterType, columns, column } = this.prepareFilterType(
    //     filterKey,
    //     this.filterBy[filterKey],
    //   );

    //   if (typeof filterType === "function") {
    //     await filterType(filterValue, this.query);
    //     continue;
    //   }

    //   // where operators
    //   if (whereOperators.includes(filterType as WhereOperator)) {
    //     this.whereOperatorsFilter(
    //       column,
    //       filterValue,
    //       columns,
    //       filterType as WhereOperator,
    //     );
    //     continue;
    //   }
    // }

    for (const optionKey in this.filterBy) {
      const filterValue = this.option(optionKey);
      if (filterValue === undefined) continue;

      const { filterType, columns, column } = this.prepareFilterType(
        optionKey,
        this.filterBy[optionKey],
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

      // int>
      if (filterType === "int>") {
        const value = parseInt(filterValue);
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
      }

      // int>=
      if (filterType === "int>=") {
        const value = parseInt(filterValue);
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
      }

      // int<
      if (filterType === "int<") {
        const value = parseInt(filterValue);
        if (column) {
          this.query.where(column, "<", value);
        } else if (columns) {
          const columnsAsObject: any = {};

          for (const column of columns) {
            columnsAsObject[column] = {
              $lt: value,
            };
          }

          this.query.orWhere(columnsAsObject);
        }
      }

      // int<=
      if (filterType === "int<=") {
        const value = parseInt(filterValue);
        if (column) {
          this.query.where(column, "<=", value);
        } else if (columns) {
          const columnsAsObject: any = {};

          for (const column of columns) {
            columnsAsObject[column] = {
              $lte: value,
            };
          }

          this.query.orWhere(columnsAsObject);
        }
      }

      // inInt
      if (filterType === "inInt") {
        const value = this.returnAsArray(filterValue).map((v: any) =>
          parseInt(v),
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
        const value = this.returnAsArray(filterValue).map((v: any) =>
          Number(v),
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

      // float, double
      if (["float", "double"].includes(filterType)) {
        const value = this.returnAsArray(filterValue).map((v: any) =>
          parseFloat(v),
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

      // null
      if (filterType === "null") {
        if (column) {
          this.query.whereNull(column);
        } else if (columns) {
          const columnsAsObject: any = {};

          for (const column of columns) {
            columnsAsObject[column] = null;
          }

          this.query.orWhere(columnsAsObject);
        }

        continue;
      }

      // notNull | !null
      if (["notNull", "!null"].includes(filterType)) {
        if (column) {
          this.query.whereNotNull(column);
        } else if (columns) {
          const columnsAsObject: any = {};

          for (const column of columns) {
            columnsAsObject[column] = {
              $ne: null,
            };
          }

          this.query.orWhere(columnsAsObject);
        }

        continue;
      }

      // inDate

      if (filterType === "inDate") {
        const value = this.returnAsArray(filterValue).map((v: any) =>
          this.parseDate(v),
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

      // dateBetween

      if (filterType === "dateBetween") {
        const value: any = this.returnAsArray(filterValue).map((v: any) =>
          this.parseDate(v),
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
        const value = this.returnAsArray(filterValue).map((v: any) =>
          this.parseDate(v, this.dateTimeFormat),
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
        const value: any = this.returnAsArray(filterValue).map((v: any) =>
          this.parseDate(v, this.dateTimeFormat),
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
   * Return the given value as a array
   */
  protected returnAsArray(value: any) {
    if (!Array.isArray(value)) return [value];

    return value;
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
   * Get option's value for the given key
   */
  protected option(key: string, defaultValue?: any) {
    return get(this.options, key, defaultValue);
  }

  /**
   * Make order by
   */
  protected parseOrderBy(orderByOptions: any) {
    if (!orderByOptions) return;

    const orderBy = orderByOptions;

    if (Array.isArray(orderBy)) {
      const [column, direction] = orderBy;

      this.query.orderBy(column, direction);
      return;
    }

    if (orderBy === "random") {
      this.query.random(this.options.limit || this.options.defaultLimit);
    }

    this.query.sortBy(orderBy);
  }

  /**
   * Prepare options
   */
  protected prepareOptions(options: RepositoryOptions = {}) {
    this.paginationInfo = undefined;
    this.options = {
      ...options,
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
}
