import { Rule } from "./rule";

export class ArrayRule extends Rule {
  /**
   * Rule name
   */
  public static ruleName = "array";

  /**
   * Validate the rule
   */
  public async validate() {
    this.isValid = Array.isArray(this.value);
  }

  /**
   * Get error message
   */
  public error() {
    return this.trans("array");
  }
}
