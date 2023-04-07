import { Model } from "@mongez/mongodb";
import { RepositoryDestroyManager } from "./repository-destroyer-manager";
import { SaveMode } from "./types";

export abstract class RepositoryFillerManager<
  T extends Model,
  M extends typeof Model = typeof Model
> extends RepositoryDestroyManager<T, M> {
  /**
   * Create new record
   */
  public async create(data: any): Promise<T> {
    const Model: any = this.model;

    const model = new Model(data);

    this.onSaving(model, data);
    this.onCreating(model, data);

    this.setData(model, data, "create");

    this.trigger("creating", model, data);
    this.trigger("saving", model, data);

    await model.save();

    this.onCreate(model, data);
    this.onSave(model, data);

    this.trigger("create", model);
    this.trigger("save", model);

    return model;
  }

  /**
   * Set data
   */
  protected setData(model: T, data: any, saveMode: SaveMode) {
    //
  }

  /**
   * Update record
   */
  public async update(id: number | string | T, data: any) {
    const model = await this.find(id);

    if (!model) return;

    const currentModel = this.newModel(model.data);

    this.onUpdating(model, data);
    this.onSaving(model, data);

    this.setData(model, data, "update");

    this.trigger("updating", model, data);
    this.trigger("saving", model, data);

    await model.save(data);

    this.onUpdate(model, data, currentModel);
    this.onSave(model, data, currentModel);

    this.trigger("update", model, currentModel);
    this.trigger("save", model, currentModel);

    return model;
  }

  /**
   * On creating event
   */
  // eslint-disable-next-line unused-imports/no-unused-vars
  protected onCreating(model: T, data: any) {
    //
  }

  /**
   * On create event
   */
  // eslint-disable-next-line unused-imports/no-unused-vars
  protected onCreate(model: T, data: any) {
    //
  }

  /**
   * On updating event
   */
  // eslint-disable-next-line unused-imports/no-unused-vars
  protected onUpdating(model: T, data: any, oldModel?: T) {
    //
  }

  /**
   * On update event
   */
  // eslint-disable-next-line unused-imports/no-unused-vars
  protected onUpdate(model: T, data: any, oldModel?: T) {
    //
  }

  /**
   * On saving event
   */
  // eslint-disable-next-line unused-imports/no-unused-vars
  protected onSaving(model: T, data: any, oldModel?: T) {
    //
  }

  /**
   * On save event
   */
  // eslint-disable-next-line unused-imports/no-unused-vars
  protected onSave(model: T, data: any, oldModel?: T) {
    //
  }
}
