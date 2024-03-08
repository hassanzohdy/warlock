import { Rule } from "./rule";

export class MinRule extends Rule {
  /**
   * Rule name
   */
  public static ruleName = "min";

  /**
   * Validate the rule
   */
  public async validate() {
    this.isValid = Number(this.value) >= Number(this.options[0]);
  }

  /**
   * {@inheritdoc}
   */
  public toJson() {
    return `Min: ${this.options[0]}`;
  }

  /**
   * Get error message
   */
  public error() {
    return this.trans("min", {
      min: this.options[0],
    });
  }
}
