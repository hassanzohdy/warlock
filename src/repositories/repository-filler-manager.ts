import { FindOrCreateOptions, Model } from "@mongez/monpulse";
import { GenericObject } from "@mongez/reinforcements";
import { Request } from "../http";
import { RepositoryDestroyManager } from "./repository-destroyer-manager";
import { RepositoryFiller } from "./repository-filler";
import { Fillable, SaveMode } from "./types";

export abstract class RepositoryFillerManager<
  T extends Model,
  M extends typeof Model = typeof Model,
> extends RepositoryDestroyManager<T, M> {
  /**
   * Data to be filled in the model during creation|update|patch
   */
  protected fillable?: Fillable;

  /**
   * Filled inputs
   * Will be used with create or update to only get the inputs that are fillable
   */
  protected filled?: string[];

  /**
   * Create new record
   */
  public create(data: any): Promise<T> {
    const filler = this.makeFiller();

    if (data instanceof Request) {
      data = data.all();
    }

    return filler.create(data) as Promise<T>;
  }

  /**
   * Update record
   */
  public async update(id: number | string | T, data: any) {
    const model = id instanceof Model ? id : await this.find(id);

    if (!model) return;

    if (data instanceof Request) {
      data = data.all();
    }

    const filler = this.makeFiller();

    return filler.update(model, data) as Promise<T>;
  }

  /**
   * Find or create
   */
  public async findOrCreate(
    where: GenericObject,
    data: GenericObject,
    options?: FindOrCreateOptions,
  ) {
    return this.model.findOrCreate(where, data, options);
  }

  /**
   * Update or create
   */
  public async updateOrCreate(where: GenericObject, data: GenericObject) {
    return this.model.updateOrCreate(where, data);
  }

  /**
   * Set data
   */
  public async setData(_model: T, _data: any, _saveMode: SaveMode) {
    //
  }

  /**
   * Make new instance of the filler
   */
  public makeFiller(): RepositoryFiller {
    return new RepositoryFiller(this, this.getFillable(), this.filled);
  }

  /**
   * Get fillable data
   */
  public getFillable() {
    return this.fillable;
  }

  /**
   * On creating event
   */
  // eslint-disable-next-line unused-imports/no-unused-vars
  public async onCreating(_model: T, _data: any) {
    //
  }

  /**
   * On create event
   */
  // eslint-disable-next-line unused-imports/no-unused-vars
  public async onCreate(_model: T, _data: any) {
    //
  }

  /**
   * On updating event
   */
  // eslint-disable-next-line unused-imports/no-unused-vars
  public async onUpdating(_model: T, _data: any, _oldModel?: T) {
    //
  }

  /**
   * On update event
   */
  // eslint-disable-next-line unused-imports/no-unused-vars
  public async onUpdate(_model: T, _data: any, _oldModel?: T) {
    //
  }

  /**
   * On saving event
   */
  // eslint-disable-next-line unused-imports/no-unused-vars
  public async onSaving(_model: T, _data: any, _oldModel?: T) {
    //
  }

  /**
   * On save event
   */
  // eslint-disable-next-line unused-imports/no-unused-vars
  public async onSave(_model: T, _data: any, _oldModel?: T) {
    //
  }
}
