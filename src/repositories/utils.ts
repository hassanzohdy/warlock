import { RepositoryOptions } from "./types";

export const defaultRepositoryOptions: RepositoryOptions = {
  defaultLimit: 15,
  paginate: true,
  orderBy: ["id", "desc"],
};
