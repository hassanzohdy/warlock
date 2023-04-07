import Rule from "./rule";

export default class MinLengthRule extends Rule {
  /**
   * Rule name
   */
  public static ruleName = "minLength";

  /**
   * Validate the rule
   */
  public async validate() {
    this.isValid = String(this.value).length >= this.options[0];
  }

  /**
   * Get error message
   */
  public error() {
    return this.trans("minLength", {
      max: this.options[0],
    });
  }
}
