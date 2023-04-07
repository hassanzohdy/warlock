import Is from "@mongez/supportive-is";
import { Rule } from "./rule";

export class StringRule extends Rule {
  /**
   * Rule name
   */
  public static ruleName = "string";

  /**
   * Validate the rule
   */
  public async validate() {
    this.isValid = Is.string(this.value) && !Is.numeric(this.value);
  }

  /**
   * Get error message
   */
  public error() {
    return this.trans("string");
  }
}
