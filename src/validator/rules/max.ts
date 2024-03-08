import { Rule } from "./rule";

export class MaxRule extends Rule {
  /**
   * Rule name
   */
  public static ruleName = "max";

  /**
   * Validate the rule
   */
  public async validate() {
    this.isValid = Number(this.value) <= Number(this.options[0]);
  }

  /**
   * {@inheritdoc}
   */
  public toJson() {
    return `Max: ${this.options[0]}`;
  }

  /**
   * Get error message
   */
  public error() {
    return this.trans("max", {
      max: this.options[0],
    });
  }
}
