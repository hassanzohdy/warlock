import { Model } from "@mongez/mongodb";
import { RepositoryFillerManager } from "./repository-filler-manager";

export abstract class RepositoryManager<
  T extends Model,
  M extends typeof Model = typeof Model,
> extends RepositoryFillerManager<T, M> {
  //
}
