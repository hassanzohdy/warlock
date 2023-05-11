import { Model, ModelAggregate, WhereOperator } from "@mongez/mongodb";

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
  | ((value: any, query: ModelAggregate<any>) => any)
  | [FilterOptionType]
  | [FilterOptionType, string | string[]];

export type FilterByOptions = {
  [key: string]: FilterByType;
};

export type SaveMode = "create" | "update" | "patch";

export type RepositoryOptions = {
  defaultLimit?: number;
  paginate?: boolean;
  limit?: number;
  owned?: boolean;
  page?: number;
  select?: string[];
  deselect?: string[];
  purgeCache?: boolean;
  orderBy?:
    | string
    | [string, "asc" | "desc"]
    | {
        [key: string]: "asc" | "desc";
      };
  [key: string]: any;
  perform?: (query: any) => void;
};

export type CachedRepositoryOptions = RepositoryOptions & {
  cache?: boolean;
  cacheCurrentLocale?: boolean;
};
