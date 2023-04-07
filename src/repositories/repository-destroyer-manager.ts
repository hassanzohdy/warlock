import { Model } from "@mongez/mongodb";
import { RepositoryListManager } from "./repository-list-manager";
import { RepositoryOptions } from "./types";

export abstract class RepositoryDestroyManager<
  T extends Model,
  M extends typeof Model = typeof Model
> extends RepositoryListManager<T, M> {
  /**
   * Delete Record
   */
  public async delete(id: number | string | T) {
    const model = await this.find(id);

    if (!model) return;

    this.onDeleting(model);

    this.trigger("deleting", model);

    await model.destroy();

    this.onDelete(model);

    this.trigger("delete", model);

    return model;
  }

  /**
   * On deleting
   */
  // eslint-disable-next-line unused-imports/no-unused-vars
  protected onDeleting(model: T) {
    //
  }

  /**
   * On delete
   */
  // eslint-disable-next-line unused-imports/no-unused-vars
  protected onDelete(model: T) {
    //
  }

  /**
   * Delete multiple records
   */
  public async deleteMany(options: RepositoryOptions) {
    this.prepareOptions(options);

    const Model = this.model;

    this.query = (Model as any).aggregate();

    if (!this.query) return 0;

    this.parseFilterBy();

    this.filter();

    return await this.query.delete();
  }
}
