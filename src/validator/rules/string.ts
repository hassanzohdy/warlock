import { Rule } from "./rule";

export class StringRule extends Rule {
  /**
   * Rule name
   */
  public static ruleName = "string";

  /**
   * Validate the rule
   */
  public async validate() {
    this.isValid = typeof this.value === "string";
  }

  /**
   * Get error message
   */
  public error() {
    return this.trans("string");
  }
}
