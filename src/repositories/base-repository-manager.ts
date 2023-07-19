import events from "@mongez/events";
import { Model } from "@mongez/monpulse";
import { RepositoryEvent } from "./types";

export class BaseRepositoryManager<
  T extends Model,
  StaticModel extends typeof Model = typeof Model,
> {
  /**
   * Base model
   */
  protected model!: StaticModel;

  /**
   * Repository name
   *
   * If not set, it will be generated from the model collection name
   */
  protected name?: string;

  /**
   * Date format
   */
  public dateFormat = "DD-MM-YYYY";

  /**
   * Date time format
   */
  public dateTimeFormat = "DD-MM-YYYY HH:mm:ss";

  /**
   * Constructor
   */
  public constructor() {
    this.boot();
  }

  /**
   * Boot
   */
  protected boot() {
    //
  }

  /**
   * Get repository name
   */
  public getName() {
    if (this.name) return this.name;

    return this.model.collection;
  }

  /**
   * Trigger repository event
   */
  public trigger(eventName: RepositoryEvent, ...args: any[]) {
    const event = `repository.${this.getName()}.${eventName}`;

    events.trigger(event, ...args);

    events.trigger(`repository.${eventName}`, this, ...args);
  }

  /**
   * Listen to repository event
   */
  public on(eventName: RepositoryEvent, callback: (...args: any[]) => void) {
    const event = `repository.${this.getName()}.${eventName}`;

    events.subscribe(event, callback);

    events.subscribe(`repository.${eventName}`, callback);
  }

  /**
   * Create new model
   */
  public newModel(data?: any): T {
    const Model: any = this.model;

    return new Model(data);
  }
}
