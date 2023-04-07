import { RepositoryOptions } from "./types";

export const defaultRepositoryOptions: RepositoryOptions = {
  limit: 15,
  paginate: true,
  orderBy: ["id", "desc"],
};
