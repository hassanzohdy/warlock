import { Rule } from "./rule";

export class ArrayOfRule extends Rule {
  /**
   * Rule name
   */
  public static ruleName = "arrayOf";

  /**
   * Detect if the value is an array
   */
  protected isArray = true;

  /**
   * Validate the rule
   */
  public async validate() {
    this.isValid = Array.isArray(this.value);

    if (!this.isValid) {
      this.isArray = false;
      return;
    }

    const type = this.options[0];

    if (!type) return;

    this.isValid = (this.value as any[]).every(item => typeof item === type);
  }

  /**
   * Get error message
   */
  public error() {
    if (!this.isArray) {
      return this.trans("array");
    }

    return this.trans("arrayOf", { type: this.options[0] });
  }
}
