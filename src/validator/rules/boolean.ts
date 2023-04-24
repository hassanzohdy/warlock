import { Rule } from "./rule";

export class BooleanRule extends Rule {
  /**
   * Rule name
   */
  public static ruleName = "boolean";

  /**
   * Validate the rule
   */
  public async validate() {
    this.isValid = typeof this.value === "boolean";
  }

  /**
   * Get error message
   */
  public error() {
    return this.trans("boolean");
  }
}
