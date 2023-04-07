import Rule from "./rule";

export default class InRule extends Rule {
  /**
   * Rule name
   */
  public static ruleName = "in";

  /**
   * Validate the rule
   */
  public async validate() {
    this.isValid = this.options.includes(this.value);
  }

  /**
   * Get error message
   */
  public error() {
    return this.trans("minLength", {
      values: this.options.join("|"),
    });
  }
}
