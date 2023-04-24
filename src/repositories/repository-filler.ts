import { log } from "@mongez/logger";
import { Model } from "@mongez/mongodb";
import { GenericObject, get, only, set } from "@mongez/reinforcements";
import { RepositoryManager } from "./repository-manager";
import {
  Fillable,
  FillableColumnDataType,
  FillableColumnOptions,
} from "./types";

export class RepositoryFiller {
  /**
   * Constructor
   */
  public constructor(
    protected repository: RepositoryManager<any, any>,
    protected fillable?: Fillable,
    protected filled?: string[],
  ) {
    //
  }

  /**
   * Create new record
   */
  public async create(data: any): Promise<Model> {
    const model = this.repository.newModel();

    if (this.fillable) {
      data = await this.parseFillable(model, data);
    } else if (this.filled) {
      data = only(data, this.filled);
    } else {
      const repositoryName = this.repository.constructor.name;
      log.warn(
        "repository",
        "create",
        `fillable property is not defined nor filled property for ${repositoryName} repository, this will save danger data in the database`,
      );
    }

    await this.repository.setData(model, data, "create");

    this.repository.onSaving(model, data);
    this.repository.onCreating(model, data);

    this.repository.trigger("creating", model, data);
    this.repository.trigger("saving", model, data);

    await model.save(data);

    this.repository.onCreate(model, data);
    this.repository.onSave(model, data);

    this.repository.trigger("create", model);
    this.repository.trigger("save", model);

    return model;
  }

  /**
   * Update record
   */
  public async update(model: Model, data: any) {
    const currentModel = this.repository.newModel(model.data);

    if (this.fillable) {
      data = await this.parseFillable(model, data);
    } else {
      log.warn(
        "repository",
        "update",
        "fillable is not defined for this repository, this will save danger data in the database",
      );
    }

    this.repository.onUpdating(model, data);
    this.repository.onSaving(model, data);

    await this.repository.setData(model, data, "update");

    this.repository.trigger("updating", model, data);
    this.repository.trigger("saving", model, data);

    await model.save(data);

    this.repository.onUpdate(model, data, currentModel);
    this.repository.onSave(model, data, currentModel);

    this.repository.trigger("update", model, currentModel);
    this.repository.trigger("save", model, currentModel);

    return model;
  }

  /**
   * Increment a column value
   */
  public async increment(model: Model | number, column: string, value = 1) {
    if (typeof model === "number") {
      model = (await this.repository.find(model)) as Model;
    }

    await model.increment(column, value);

    return model;
  }

  /**
   * Decrement a column value
   */
  public async decrement(model: Model | number, column: string, value = 1) {
    if (typeof model === "number") {
      model = (await this.repository.find(model)) as Model;
    }

    await model.decrement(column, value);

    return model;
  }

  /**
   * Parse fillable
   */
  protected async parseFillable(model: Model, data: any) {
    //
    const returnedData: GenericObject = {};

    for (const key in this.fillable) {
      const { defaultValue, column, value, isValid, mandatory } =
        await this.parseFillableInput(key, this.fillable[key], data, model);

      if (!isValid) continue;

      const isValuePresent = value !== undefined;

      let columnValue = value;

      if (!isValuePresent) {
        if (!mandatory) continue;

        // it means the value is not present and it's mandatory
        // so we need to set the default value as the column value
        columnValue = defaultValue;
      }

      set(returnedData, column, columnValue);
    }

    return returnedData;
  }

  /**
   * Parse fillable input and return the value based on the fill options
   */
  protected async parseFillableInput(
    key: string,
    fillable: FillableColumnDataType | FillableColumnOptions,
    data: any,
    model: Model,
  ) {
    let value = get(data, key);

    let options: Partial<FillableColumnOptions> = {};

    if (typeof fillable !== "object") {
      options = {
        type: fillable,
        column: key,
        mandatory: false,
        validate: () => true,
      };
    } else {
      options = {
        type: "string",
        column: key,
        mandatory: false,
        validate: () => true,
        ...fillable,
      };
    }

    const isValid = options.validate
      ? await options.validate(value, model, data)
      : true;

    if (value !== undefined && isValid) {
      // now cast the value to the type
      value = await this.castValue(
        value,
        model,
        options.type as FillableColumnDataType,
      );
    }

    return {
      value,
      column: options.column || key,
      defaultValue: options.defaultValue,
      isValid,
      mandatory: options.mandatory,
    };
  }

  /**
   * Cast value to the given type
   */
  protected async castValue(
    value: any,
    model: Model,
    type: FillableColumnDataType,
  ) {
    if (typeof type === "function") {
      return await type(value, model);
    }

    switch (type) {
      case "string":
        return String(value);
      case "email":
        return String(value).toLowerCase();
      case "number":
        return Number(value);
      case "boolean":
      case "bool":
        return Boolean(value);
      case "int":
      case "integer":
        return parseInt(value);
      case "float":
      case "double":
        return parseFloat(value);
      case "array":
        return Array.isArray(value) ? value : [value];
      case "object":
        return typeof value === "object" ? value : JSON.parse(value);
      case "date":
        return new Date(value);
      case "dateTime":
        return new Date(value);
      case "location":
        return {
          type: "Point",
          coordinates: [value.lng, value.lat],
        };
      default:
        return value;
    }
  }
}
