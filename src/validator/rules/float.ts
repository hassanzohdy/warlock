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
    // we need to make sure that this is a float value not an integer
    this.isValid = !isNaN(value) && value % 1 !== 0;
  }

  /**
   * Get error message
   */
  public error() {
    return this.trans("float");
  }
}
