import config from "@mongez/config";
import type { Request } from "../http";
import { ArrayRule, RequiredRule } from "./rules";
import { RulesList } from "./rules-list";
import { ValidationSchema } from "./validation-schema";
import { validatorEvents } from "./validator-events";

export class ValidationSchemaValidator {
  /**
   * Errors list
   */
  protected errorsList: any[] = [];

  /**
   * Request handler
   */
  protected request!: Request;

  /**
   * Base input name
   */
  protected baseInputName?: string;

  /**
   * Base input value
   */
  protected baseInputValue?: any;

  /**
   * Check if this schema is a schema of an array of objects
   */
  protected triggerValidationUpdate = false;

  /**
   * constructor
   */
  public constructor(public readonly validationSchema: ValidationSchema) {
    //
  }

  /**
   * Set request
   */
  public setRequest(request: Request) {
    this.request = request;

    return this;
  }

  /**
   * Whether to trigger validation update event
   */
  public setTriggerValidationUpdate(triggerValidationUpdate: boolean) {
    this.triggerValidationUpdate = triggerValidationUpdate;

    return this;
  }

  /**
   * Set base input name
   */
  public setBaseInputName(baseInputName: string) {
    this.baseInputName = baseInputName;

    return this;
  }

  /**
   * Set base input value
   */
  public setBaseInputValue(baseInputValue: any) {
    this.baseInputValue = baseInputValue;

    return this;
  }

  /**
   * An alias to scan method
   */
  public async validate() {
    await this.scan();

    return this;
  }

  /**
   * Scan the validation rules
   */
  public async scan() {
    this.errorsList = [];

    if (Object.keys(this.validationSchema.inputs).length === 0) return this;

    if (this.validationSchema.isArraySchema && this.baseInputName) {
      const inputValue = this.request.input(this.baseInputName);

      if (!Array.isArray(inputValue)) {
        const rules = [new ArrayRule()];

        if (this.validationSchemaHasRequiredInput()) {
          rules.unshift(new RequiredRule());
        }

        const rulesList = new RulesList(
          this.baseInputName,
          inputValue,
          rules,
        ).setRequest(this.request);

        await rulesList.validate();

        if (rulesList.fails()) {
          const errors = rulesList.errors();
          this.addError(errors[0], errors[1]);
        }
      } else {
        await this.validateArray(inputValue);
      }

      return this;
    }

    for (const input in this.validationSchema.inputs) {
      const inputRules = this.validationSchema.inputs[input];
      const inputNamePath = this.getInputNamePath(input);

      if (inputRules instanceof ValidationSchema) {
        const schema = new ValidationSchemaValidator(inputRules);
        schema.setBaseInputName(inputNamePath).setRequest(this.request);

        await schema.scan();

        if (schema.fails()) {
          const errors = schema.errors();
          this.addError(errors[0], errors[1]);
        }

        continue;
      }

      const inputValue = this.getInputValue(inputNamePath);

      await this.validateInput(inputNamePath, inputValue, inputRules);
    }

    return this;
  }

  /**
   * Check if current validation schema has required input
   */
  protected validationSchemaHasRequiredInput() {
    for (const input in this.validationSchema.inputs) {
      const inputRules = this.validationSchema.inputs[input];

      if (inputRules instanceof ValidationSchema) {
        const schema = new ValidationSchemaValidator(inputRules);

        if (schema.validationSchemaHasRequiredInput()) {
          return true;
        }

        continue;
      }

      for (const rule of inputRules) {
        if (rule === "required" || rule instanceof RequiredRule) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Trigger validation update event
   */
  public triggerValidationUpdateEvent() {
    // 👇🏻 trigger validation done
    const passes = this.passes();
    validatorEvents.trigger("done", passes, this.validationSchema.inputs, this);

    // 👇🏻 check if validation passes, then trigger the passes event
    // otherwise trigger fails event
    if (passes) {
      validatorEvents.trigger("passes", this.validationSchema.inputs, this);
    } else {
      validatorEvents.trigger("fails", this.validationSchema.inputs, this);
    }
  }

  /**
   * Validate array of inputs
   */
  protected async validateArray(inputValue: any[]) {
    const baseInput = this.baseInputName!;

    for (let i = 0; i < inputValue.length; i++) {
      const value = inputValue[i];
      for (const input in this.validationSchema.inputs) {
        const inputName = `${baseInput}.${i}.${input}`;

        const inputRules = this.validationSchema.inputs[input];

        if (inputRules instanceof ValidationSchema) {
          const schema = new ValidationSchemaValidator(inputRules);
          schema
            .setBaseInputName(inputName)
            .setBaseInputValue(value)
            .setRequest(this.request);

          await schema.scan();

          if (schema.fails()) {
            const errors = schema.errors();
            this.addError(errors[0], errors[1]);
          }

          continue;
        }

        await this.validateInput(inputName, value[input], inputRules);
      }
    }
  }

  /**
   * Validate input
   */
  protected async validateInput(
    input: string,
    value: any,
    rules: any,
  ): Promise<void> {
    const rulesList = new RulesList(input, value, rules);

    rulesList.setRequest(this.request);

    await rulesList.validate();

    if (rulesList.fails()) {
      const error = rulesList.errors();
      this.addError(error[0], error[1]);
    }
  }

  /**
   * Get input name path
   */
  public getInputNamePath(input: string) {
    return this.baseInputName ? `${this.baseInputName}.${input}` : input;
  }

  /**
   * Get input value
   */
  protected getInputValue(input: string) {
    if (this.baseInputName && this.baseInputValue) {
      return this.baseInputValue[input];
    }

    return this.request.input(input);
  }

  /**
   * Check if validator fails
   */
  public fails() {
    return this.errorsList.length > 0;
  }

  /**
   * Check if validator passes
   */
  public passes() {
    return this.errorsList.length === 0;
  }

  /**
   * Add new error
   */
  public addError(inputName: string, message: string) {
    const inputKey = config.get("validation.keys.inputKey", "input");
    const inputError = config.get("validation.keys.inputError", "error");

    this.errorsList.push({
      [inputKey]: inputName,
      [inputError]: message,
    });

    return this;
  }

  /**
   * Get errors list
   */
  public errors() {
    return this.errorsList;
  }
}
