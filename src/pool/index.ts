import type { Model } from "@mongez/monpulse";
import { requestContext } from "../http";

export class Pool {
  /**
   * Models pool
   * This is mainly used by validation rules to store the models that was used in the validation
   */
  public modelsPool = new Map<string, Model[]>();

  /**
   * Add model to the models pool
   */
  public add({ model }: { model: Model }) {
    const collection = model.getCollection();

    if (!this.modelsPool.has(collection)) {
      this.modelsPool.set(collection, []);
    }

    const models = this.modelsPool.get(collection);

    models?.push(model);
  }

  /**
   * Check if there is a model in the models pool
   */
  public get<T extends Model = Model>(
    id: string | number,
    model: typeof Model | string,
  ): T | undefined {
    const models = this.list<T>(model);

    return models?.find(model => model.id === id) as T;
  }

  /**
   * Get all models from the pool related to the given model type/collection
   */
  public list<T extends Model = Model>(model: typeof Model | string) {
    const collection = typeof model === "string" ? model : model.collection;

    return (this.modelsPool.get(collection) || []) as T[];
  }
}

export function pool(): Pool {
  const { request } = requestContext();

  if (!request.pool) {
    request.pool = new Pool();
  }

  return request.pool;
}
