import { Model } from "@mongez/mongodb";
import { GenericObject, get, set, unset } from "@mongez/reinforcements";
import Is from "@mongez/supportive-is";
import dayjs from "dayjs";
import { Request } from "../http";
import { requestContext } from "../http/middleware/inject-request-context";
import { assetsUrl, uploadsUrl, url } from "../utils/urls";
import { FinalOutput, OutputResource, OutputValue } from "./types";

export class Output {
  /**
   * Final data output
   */
  protected data: GenericObject = {};

  /**
   * Disabled keys from being returned in the final output
   */
  protected static disabledKeys: string[] = [];

  /**
   * The only allowed keys
   */
  protected static allowedKeys: string[] = [];

  /**
   * Output shape
   */
  protected output: FinalOutput = {};

  /**
   * Defaults when key is missing from the given data
   */
  protected defaults = {};

  /**
   * Default date format
   */
  protected dateFormat = "DD-MM-YYYY hh:mm:ss A";

  /**
   * Original resource data
   */
  protected originalResource!: OutputResource;

  /**
   * Request object
   * Injected when output is sent to response
   * If you're going to use toJSON before sending it to response
   * Make sure to attach the request object to the output
   */
  public request!: Request;

  /**
   * Constructor
   */
  public constructor(protected resource: OutputResource = {}) {
    //
    if (this.resource instanceof Model) {
      this.resource = this.resource.data;
    } else if (this.resource instanceof Output) {
      this.resource = this.resource.resource;
    }

    this.originalResource = resource;
  }

  /**
   * return list of resources for the given array ouf data
   */
  public static collect(data: OutputResource[]) {
    return data.map(item => {
      return new this(item);
    });
  }

  /**
   * Set value to the final output
   */
  public set(key: string, value: any) {
    set(this.data, key, value);

    return this;
  }

  /**
   * Get value from final output
   */
  public get(key: string, defaultValue = null) {
    return get(this.resource, key, defaultValue);
  }

  /**
   * Remove a key from the final output
   */
  public remove(...keys: string[]) {
    unset(this.data, keys);
  }

  /**
   * Disable the given keys
   */
  public static disable(...keys: string[]) {
    // make sure that they are not in the allowed keys
    for (const key of keys) {
      const keyIndex = this.allowedKeys.indexOf(key);

      if (keyIndex > -1) {
        this.allowedKeys.splice(keyIndex, 1);
      }
    }
    this.disabledKeys.push(...keys);

    return this;
  }

  /**
   * Remove the given keys from the disabled keys
   */
  public static enable(...keys: string[]) {
    for (const key of keys) {
      const keyIndex = this.disabledKeys.indexOf(key);

      if (keyIndex > -1) {
        this.disabledKeys.splice(keyIndex, 1);
      }
    }

    return this;
  }

  /**
   * Allow only the given keys
   */
  public static allow(...keys: string[]) {
    // make sure that they are not in the disabled keys
    for (const key of keys) {
      const keyIndex = this.disabledKeys.indexOf(key);

      if (keyIndex > -1) {
        this.disabledKeys.splice(keyIndex, 1);
      }
    }

    this.allowedKeys.push(...keys);

    return this;
  }

  /**
   * Reset allowed and disabled keys
   */
  public static resetKeys() {
    this.allowedKeys = [];
    this.disabledKeys = [];

    return this;
  }

  /**
   * Remove the given keys from the allowed keys
   */
  public static disallow(...keys: string[]) {
    for (const key of keys) {
      const keyIndex = this.allowedKeys.indexOf(key);

      if (keyIndex > -1) {
        this.allowedKeys.splice(keyIndex, 1);
      }
    }

    return this;
  }

  /**
   * Get final output data
   */
  public get response() {
    return this.toJSON();
  }

  /**
   * Boot method
   * Called before transforming the resource
   */
  protected async boot() {
    //
  }

  /**
   * Extend the resource output
   * Called after transforming the resource
   */
  protected async extend() {
    //
  }

  /**
   * Transform resource to object, that's going to be used as the final output
   */
  public async toJSON() {
    await this.boot();

    await this.transformOutput();

    await this.extend();

    return this.data;
  }

  /**
   * Transform final output
   */
  protected async transformOutput() {
    for (const key in this.output) {
      // first check if key is disabled
      if (this.isDisabledKey(key) || !this.isAllowedKey(key)) {
        continue;
      }

      // get value type
      let valueType = this.output[key];

      let resourceInput = key;

      if (Array.isArray(valueType)) {
        resourceInput = valueType[0];
        valueType = valueType[1];
      }

      // now get the value from the given resource data
      const value = get(
        this.resource,
        resourceInput,
        get(this.defaults, key, undefined),
      );

      if (value === undefined) {
        continue;
      }

      if (Is.object(value) && !Array.isArray(value)) {
        if (!Is.plainObject(value) && !Is.empty(value)) {
          continue;
        }
      } else if (Is.empty(value)) continue;

      if (Array.isArray(value) && valueType !== "localized") {
        set(
          this.data,
          key,
          await Promise.all(
            value.map(async item => await this.transformValue(item, valueType)),
          ),
        );
      } else {
        set(this.data, key, await this.transformValue(value, valueType));
      }
    }
  }

  /**
   * Check if the given value is valid resource value
   */
  protected isValidResourceValue(value: any) {
    return (
      (Is.plainObject(value) && !Is.empty(value)) ||
      value instanceof Output ||
      value instanceof Model
    );
  }

  /**
   * Check if the given key is disabled
   */
  protected isDisabledKey(key: string) {
    return (this.constructor as typeof Output).disabledKeys.includes(key);
  }

  /**
   * Check if the given key is allowed
   */
  protected isAllowedKey(key: string) {
    const allowedKeys = (this.constructor as typeof Output).allowedKeys;
    return allowedKeys.length === 0 || allowedKeys.includes(key);
  }

  /**
   * Transform value
   */
  protected async transformValue(
    value: any,
    valueType: OutputValue | [string, OutputValue],
  ) {
    if (typeof valueType === "string") {
      value = this.cast(value, valueType);
    } else if ((valueType as any).prototype instanceof Output) {
      // if value is not a valid resource value then return null

      if (!this.isValidResourceValue(value)) return null;

      value = await new (valueType as any)(value).toJSON();
    } else if (typeof valueType === "function") {
      value = await (valueType as any).call(this, value);
    }

    return value;
  }

  /**
   * Transform the value of the given key
   */
  public transform(key: string, type: OutputValue) {
    const value = this.get(key);

    if (!value) return;

    return this.transformValue(value, type);
  }

  /**
   * Transform and store the transformed value in the final output of the given key
   */
  public async opt(key: string, type: OutputValue) {
    const value = await this.transform(key, type);

    if (value === undefined) return;

    return this.set(key, value);
  }

  /**
   * Builtin casts
   */
  protected cast(value: any, type: OutputValue) {
    switch (type) {
      case "number":
        return Number(value);
      case "float":
      case "double":
        return parseFloat(value);
      case "int":
      case "integer":
        return parseInt(value);
      case "string":
        return String(value);
      case "boolean":
        return Boolean(value);
      case "date":
        return this.parseDate(value);
      case "birthDate": {
        const dateData: any = this.parseDate(value);
        dateData.age = dayjs().diff(value, "years");

        return dateData;
      }
      case "url":
        return url(value);
      case "uploadsUrl":
        return uploadsUrl(value);
      case "assetsUrl":
        return assetsUrl(value);
      case "localized":
        // check if the request has
        // eslint-disable-next-line no-case-declarations
        const { request } = requestContext();

        // eslint-disable-next-line no-case-declarations
        const localeCode = request?.locale;

        if (!localeCode) return value;

        if (!Array.isArray(value)) return value;

        return (
          value.find(item => item.localeCode === localeCode)?.value || value
        );
      default:
        return value;
    }
  }

  /**
   * Parse the given value
   */
  protected parseDate(value: any, format = this.dateFormat) {
    return {
      format: dayjs(value).format(format),
      timestamp: dayjs(value).unix(),
      humanTime: (dayjs(value) as any).fromNow(),
      text: new Intl.DateTimeFormat("en-US", {
        dateStyle: "long",
        timeStyle: "medium",
      }).format(value),
    };
  }
}
