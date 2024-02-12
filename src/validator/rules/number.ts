import { isNumeric } from "@mongez/supportive-is";
import { Rule } from "./rule";

export class NumberRule extends Rule {
  /**
   * Rule name
   */
  public static ruleName = "number";

  /**
   * Validate the rule
   */
  public async validate() {
    this.isValid = isNumeric(this.value);
  }

  /**
   * Get error message
   */
  public error() {
    return this.trans("number");
  }

  /**
   * {@inheritDoc}
   */
  public expectedType() {
    return "number";
  }
}
