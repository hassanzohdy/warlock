import { Rule } from "./rule";

export class MinLengthRule extends Rule {
  /**
   * Rule name
   */
  public static ruleName = "minLength";

  /**
   * Validate the rule
   */
  public async validate() {
    this.isValid = String(this.value).length >= Number(this.options[0]);
  }

  /**
   * {@inheritdoc}
   */
  public toJson() {
    return `Min Length: ${this.options[0]}`;
  }

  /**
   * Get error message
   */
  public error() {
    return this.trans("minLength", {
      min: this.options[0],
    });
  }
}
