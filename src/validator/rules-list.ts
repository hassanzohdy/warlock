import config from "@mongez/config";
import { colors } from "@mongez/copper";
import { isEmpty } from "@mongez/supportive-is";
import { Request } from "../http";
import { Rule } from "./rules/rule";

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

    for (let ruleName of this.rules) {
      let rule: Rule;

      let ruleOptions: any[] = [];

      if (ruleName instanceof Rule) {
        rule = ruleName;
      } else {
        if (ruleName.includes(":")) {
          const [baseRuleName, gluedRuleOptions] = ruleName.split(":");

          ruleOptions = gluedRuleOptions.split(",");
          ruleName = baseRuleName;
        }

        const RuleClass = config.get(`validation.rules.${ruleName}`);

        if (!RuleClass) {
          throw new Error(
            colors.bold(
              `Missing Validation Rule: ${colors.redBright(
                ruleName + " rule",
              )} is not listed under the configurations of ${colors.cyan(
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
