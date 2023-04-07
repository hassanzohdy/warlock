import { ModelAggregate, WhereOperator } from "@mongez/mongodb";

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
  | "int"
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
  paginate?: boolean;
  limit?: number;
  owned?: boolean;
  page?: number;
  orderBy?:
    | [string, "asc" | "desc"]
    | {
        [key: string]: "asc" | "desc";
      };
  [key: string]: any;
  perform?: (query: any) => void;
};
