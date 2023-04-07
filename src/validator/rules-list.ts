import config from "@mongez/config";
import Is from "@mongez/supportive-is";
import chalk from "chalk";
import { Request } from "../http";
import Rule from "./rules/rule";

export default class RulesList {
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
      Is.empty(this.value)
    )
      return;

    for (let ruleName of this.rules) {
      let rule: Rule;

      let ruleOptions = [];

      if (ruleName instanceof Rule) {
        rule = ruleName;
      } else {
        if (ruleName.includes(":")) {
          [ruleName, ruleOptions] = ruleName.split(":");

          ruleOptions = ruleOptions.split(",");
        }

        const RuleClass = config.get(`validation.rules.${ruleName}`);

        if (!RuleClass) {
          throw new Error(
            chalk.bold(
              `Missing Validation Rule: ${chalk.redBright(
                ruleName + " rule",
              )} is not listed under the configurations of ${chalk.cyan(
                "validation.rules",
              )} list`,
            ),
          );
        }

        rule = new RuleClass();
      }

      rule
        .setOptions(ruleOptions)
        .setInput(this.input)
        .setValue(this.value)
        .setRequest(this.request);

      const hasValue = !Is.empty(this.value);

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
    const inputKey = config.get("validation.keys.inputKey", "input");
    const inputError = config.get("validation.keys.inputError", "error");
    const inputErrors = config.get("validation.keys.inputErrors", "errors");

    if (returnErrorStrategy === "first") {
      return {
        [inputKey]: this.input,
        [inputError]: this.errorsList[0],
      };
    }

    return {
      [inputKey]: this.input,
      [inputErrors]: this.errorsList,
    };
  }
}
