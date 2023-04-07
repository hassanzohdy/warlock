import Rule from "./rule";

export default class FloatRule extends Rule {
  /**
   * Rule name
   */
  public static ruleName = "float";

  /**
   * Validate the rule
   */
  public async validate() {
    this.isValid = Number.isFinite(Number(this.value));
  }

  /**
   * Get error message
   */
  public error() {
    return this.trans("integer");
  }
}
