import { Model, ModelAggregate, WhereOperator } from "@mongez/monpulse";

export type RepositoryEvent =
  | "listing"
  | "list"
  | "creating"
  | "create"
  | "updating"
  | "update"
  | "saving"
  | "save"
  | "patching"
  | "patch"
  | "deleting"
  | "delete";

export type FillableColumnDataType =
  | "string"
  | "email"
  | "number"
  | "boolean"
  | "date"
  | "dateTime"
  | "location"
  | "array"
  | "object"
  | "int"
  | "integer"
  | "float"
  | "double"
  | "bool"
  | "boolean"
  | ((value: any, model: Model) => any);

export type FillableColumnOptions = {
  /**
   * Set the column data type
   *
   * @default string
   */
  type?: FillableColumnDataType;
  /**
   * Set the default value if the value is not present
   */
  defaultValue?: any;
  /**
   * If set to false and there is no value, the column will not be updated and kept as it is
   * If set to true, the column will be updated with the default value
   *
   * @default false
   */
  mandatory?: boolean;
  /**
   * Set the column name
   *
   * @default key
   */
  column?: string;
  /**
   * Validate the value before saving it
   *
   * If the validation fails, the value will not be saved
   */
  validate?: (
    value: any,
    model: Model,
    data: any,
  ) => boolean | Promise<boolean>;
};

export type Fillable = {
  [column: string]: FillableColumnDataType | FillableColumnOptions;
};

export type FilterByOption =
  | {
      option: string;
      column?: string;
    }
  | string;

export type FilterOptionType =
  | "bool"
  | "boolean"
  | "number"
  | "inNumber"
  | "null"
  | "notNull"
  | "!null"
  | "int"
  | "int>"
  | "int>="
  | "int<"
  | "int<="
  | "in"
  | "!int"
  | "integer"
  | "inInt"
  | "float"
  | "double"
  | "inFloat"
  | "date"
  | "inDate"
  | "date>"
  | "date>="
  | "date<"
  | "date<="
  | "dateBetween"
  | "dateTime"
  | "inDateTime"
  | "dateTime>"
  | "dateTime>="
  | "dateTime<"
  | "dateTime<="
  | "dateTimeBetween"
  | "location"
  | WhereOperator;

export type FilterByType =
  | FilterOptionType
  | ((
      value: any,
      query: ModelAggregate<any>,
      options: RepositoryOptions,
    ) => any)
  | [FilterOptionType]
  | [FilterOptionType, string | string[]];

export type FilterByOptions = {
  [key: string]: FilterByType;
};

export type SaveMode = "create" | "update" | "patch";

export type RepositoryOptions = {
  /**
   * Default limit for listing
   *
   * @default 15
   */
  defaultLimit?: number;
  /**
   * Whether to paginate the results or not
   *
   * @default true
   */
  paginate?: boolean;
  /**
   * If passed, it will be used instead of the default limit
   *
   * @default undefined
   */
  limit?: number;
  /**
   * Page number
   *
   * @default 1
   */
  page?: number;
  /**
   * Select only the passed columns, useful for performance
   *
   * @default *
   */
  select?: string[];
  /**
   * Deselect the given array of columns, useful when need to hide some columns
   * especially when dealing with conditional data
   */
  deselect?: string[];
  /**
   * Whether to clear cache, works only when cache is enabled
   */
  purgeCache?: boolean;
  /**
   * Order the documents.
   * It can be an object, the key is the column name and the value is the order direction it can be asc or desc
   * It could also be an array, first item is the column name and the second is the order direction
   * If set to `random` the documents will be ordered randomly
   *
   * @default {id: 'desc'}
   */
  orderBy?:
    | "random"
    | string
    | [string, "asc" | "desc"]
    | {
        [key: string]: "asc" | "desc";
      };
  /**
   * Perform a query by using the query aggregate, useful for advanced queries
   */
  perform?: (query: ModelAggregate<any>, options: RepositoryOptions) => void;
  /**
   * Any additional options to be passed to the list method
   */
  [key: string]: any;
};

export type CachedRepositoryOptions = RepositoryOptions & {
  cache?: boolean;
  cacheCurrentLocale?: boolean;
};
