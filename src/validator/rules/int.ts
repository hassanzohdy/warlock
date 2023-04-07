import { Rule } from "./rule";

export class IntRule extends Rule {
  /**
   * Rule name
   */
  public static ruleName = "int";

  /**
   * Validate the rule
   */
  public async validate() {
    this.isValid = Number.isInteger(Number(this.value));
  }

  /**
   * Get error message
   */
  public error() {
    return this.trans("integer");
  }
}
