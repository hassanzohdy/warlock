import { Rule } from "./rule";

export class LengthRule extends Rule {
  /**
   * Rule name
   */
  public static ruleName = "length";

  /**
   * Validate the rule
   */
  public async validate() {
    this.isValid = String(this.value).length === Number(this.options[0]);
  }

  /**
   * Get error message
   */
  public error() {
    return this.trans("length", {
      max: this.options[0],
    });
  }
}
