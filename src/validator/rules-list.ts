import config from "@mongez/config";
import { isEmpty } from "@mongez/supportive-is";
import { Request } from "../http";
import { getRuleHandler } from "./utils";

export class RulesList {
  /**
   * Errors list
   */
  protected errorsList: any = [];

  /**
   * Request instance
   */
  protected request!: Request;

  /**
   * Constructor
   */
  public constructor(
    protected readonly input: string,
    protected readonly value: any,
    protected readonly rules: any,
  ) {
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
   * Validate the rules
   */
  public async validate() {
    if (
      !this.rules.includes("required") &&
      !!this.rules.includes("requiredIf") &&
      isEmpty(this.value)
    )
      return;

    for (const ruleName of this.rules) {
      const rule = getRuleHandler(ruleName);

      rule.setInput(this.input).setValue(this.value).setRequest(this.request);

      const hasValue = !isEmpty(this.value);

      if (rule.requiresValue && !hasValue) continue;

      await rule.validate();

      if (rule.fails()) {
        this.errorsList.push(rule.error());

        if (config.get("validation.stopOnFirstFailure", true)) {
          break;
        }
      }
    }
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
    const returnErrorStrategy = config.get(
      "validation.returnErrorStrategy",
      "first",
    );

    if (returnErrorStrategy === "first") {
      return [this.input, this.errorsList[0]];
    }

    return [this.input, this.errorsList];
  }
}
