import events from "@mongez/events";
import { Request } from "../http";
import { ValidationEvent } from "./types";
import { ValidationSchema } from "./validation-schema";
import { ValidationSchemaValidator } from "./validation-schema-validator";
export class Validator {
  /**
   * Errors list
   */
  protected errorsList: any[] = [];

  /**
   * Validation schema
   */
  protected validationSchema!: ValidationSchema;

  /**
   * Validation schema validator
   */
  protected validationSchemaValidator!: ValidationSchemaValidator;

  /**
   * Constructor
   */
  public constructor(protected readonly request: Request) {
    //
  }

  /**
   * Set validation schema
   */
  public setValidationSchema(validationSchema: ValidationSchema) {
    this.validationSchema = validationSchema;

    this.validationSchemaValidator = new ValidationSchemaValidator(
      validationSchema,
    );

    this.validationSchemaValidator.setRequest(this.request);

    return this;
  }

  /**
   * Scan the validation schema
   */
  public async scan() {
    await this.validationSchemaValidator.scan();

    return this;
  }

  /**
   * Trigger validation update event
   */
  public triggerValidationUpdateEvent() {
    return this.validationSchemaValidator.triggerValidationUpdateEvent();
  }

  /**
   * Check if validation fails
   */
  public fails() {
    return this.validationSchemaValidator.fails();
  }

  /**
   * Check if validation passes
   */
  public passes() {
    return this.validationSchemaValidator.passes();
  }

  /**
   * Get errors list
   */
  public errors() {
    return this.validationSchemaValidator.errors();
  }

  /**
   * Trigger validation event
   */
  public static trigger(eventName: ValidationEvent, ...args: any[]) {
    return events.trigger(`validation.${eventName}`, ...args);
  }

  /**
   * Listen to the given event name
   */
  public static on(
    eventName: ValidationEvent,
    callback: (...args: any[]) => void,
  ) {
    return events.subscribe(`validation.${eventName}`, callback);
  }
}
