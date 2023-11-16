import { Rule } from "./rule";

export class FloatRule extends Rule {
  /**
   * Rule name
   */
  public static ruleName = "float";

  /**
   * Validate the rule
   */
  public async validate() {
    const value = Number(this.value);
    this.isValid = !isNaN(value) && !Number.isInteger(value);
  }

  /**
   * Get error message
   */
  public error() {
    return this.trans("float");
  }
}
