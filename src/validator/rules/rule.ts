import { merge } from "@mongez/reinforcements";
import { Request } from "../../http";

export abstract class Rule {
  /**
   * Rule name
   */
  public static ruleName = "";

  /**
   * Determine if the rule requires a value to be present
   */
  public requiresValue = true;

  /**
   * Determine if rule is valid
   */
  protected isValid = true;

  /**
   * Input name
   */
  protected input = "";

  /**
   * Input value
   */
  protected value: any = "";

  /**
   * Current request
   */
  protected request!: Request;

  /**
   * Rule options
   * This can be passed using the following syntax:
   * rule:option1,option2,option3
   */
  protected options: any[] = [];

  /**
   * Error message
   */
  protected errorMessage = "";

  /**
   * Error message attributes
   */
  protected errorMessageAttributes: any = {};

  /**
   * Set rule options
   */
  public setOptions(options: any[]) {
    this.options = options;

    return this;
  }

  /**
   * Set request
   */
  public setRequest(request: Request) {
    this.request = request;

    return this;
  }

  /**
   * Validate the rule
   */
  public async validate() {
    //
  }

  /**
   * Set input name
   */
  public setInput(input: string) {
    this.input = input;

    return this;
  }

  /**
   * Set input value
   */
  public setValue(value: any) {
    this.value = value;

    return this;
  }

  /**
   * Determine if rule validation passes
   */
  public passes() {
    return this.isValid === true;
  }

  /**
   * Determine if rule validation fails
   */
  public fails() {
    return this.isValid === false;
  }

  /**
   * Error message
   * This will override the default error message
   */
  public setErrorMessage(message: string) {
    this.errorMessage = message;

    return this;
  }

  /**
   * Translate the given key and its attributes
   */
  public trans(key: string, attributes: any = {}) {
    attributes = merge(
      {
        input: this.input,
        value: this.value,
      },
      attributes,
      this.errorMessageAttributes,
    );

    return this.request.trans(
      this.errorMessage || `validation.${key}`,
      attributes,
    );
  }

  public error() {
    return `${this.input} is not valid`;
  }
}
