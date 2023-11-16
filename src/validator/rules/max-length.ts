import { Rule } from "./rule";

export class MaxLengthRule extends Rule {
  /**
   * Rule name
   */
  public static ruleName = "maxLength";

  /**
   * Validate the rule
   */
  public async validate() {
    this.isValid = String(this.value).length <= Number(this.options[0]);
  }

  /**
   * Get error message
   */
  public error() {
    return this.trans("maxLength", {
      max: this.options[0],
    });
  }
}
