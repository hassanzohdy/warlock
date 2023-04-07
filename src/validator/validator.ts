import events from "@mongez/events";
import { Request } from "../http";
import RulesList from "./rules-list";
import { ValidationEvent } from "./types";

export default class Validator {
  /**
   * Errors list
   */
  protected errorsList: any[] = [];

  /**
   * Constructor
   */
  public constructor(
    protected readonly request: Request,
    protected rules?: any,
  ) {
    //
  }

  /**
   * Set rules
   */
  public setRules(rules: any) {
    this.rules = rules;

    return this;
  }

  /**
   * Scan the validation rules
   */
  public async scan() {
    this.errorsList = [];
    // get inputs values
    if (Object.keys(this.rules).length === 0) return this;

    // 👇🏻 trigger the validating event
    Validator.trigger("validating", this.rules, this);

    for (let input in this.rules) {
      const inputRules = this.rules[input];

      // check if input name has * in the end or in the middle
      // if so, then, the input is an array of objects
      if (input.endsWith(".*")) {
        input = input.replace(".*", "");
      } else if (input.includes(".*.")) {
        await this.validateArrayObject(input, inputRules);
      }

      const inputValue = this.request.input(input);
      const rulesList = new RulesList(input, inputValue, inputRules);

      rulesList.setRequest(this.request);

      await rulesList.validate();

      if (rulesList.fails()) {
        this.errorsList.push(rulesList.errors());
      }
    }

    // 👇🏻 trigger validation done
    const passes = this.passes();
    Validator.trigger("done", passes, this.rules, this);

    // 👇🏻 check if validation passes, then trigger the passes event
    // otherwise trigger fails event
    if (passes) {
      Validator.trigger("passes", this.rules, this);
    } else {
      Validator.trigger("fails", this.rules, this);
    }

    return this;
  }

  /**
   * Validate array of object
   */
  protected async validateArrayObject(input: string, inputRules: any) {
    const baseInput = input.split(".*.")[0];
    const baseInputValue = this.request.input(baseInput, []);

    // first validate the base input to be array
    const baseInputRulesList = new RulesList(baseInput, baseInputValue, [
      "arrayOf:object",
    ]);

    baseInputRulesList.setRequest(this.request);

    await baseInputRulesList.validate();

    if (baseInputRulesList.fails()) {
      this.errorsList.push(baseInputRulesList.errors());
    }

    // then validate each object in the array

    for (let i = 0; i < baseInputValue.length; i++) {
      // get the key of the object from the input, which should be after .*.
      const value = baseInputValue[i];
      const key = input.split(".*.")[1];
      const inputValue = value[key];
      const inputName = input.replace(".*.", `.${i}.`);

      const rulesList = new RulesList(inputName, inputValue, inputRules);

      rulesList.setRequest(this.request);

      await rulesList.validate();

      if (rulesList.fails()) {
        this.errorsList.push(rulesList.errors());
      }
    }

    return this;
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
   * Get errors list
   */
  public errors() {
    return this.errorsList;
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
