import { isPlainObject } from "@mongez/supportive-is";
import { Rule } from "./rule";

export class ObjectRule extends Rule {
  /**
   * Rule name
   */
  public static ruleName = "object";

  /**
   * Validate the rule
   */
  public async validate() {
    // this.isValid = Is.string(this.value) && !Is.numeric(this.value);
    this.isValid = isPlainObject(this.value);
  }

  /**
   * Get error message
   */
  public error() {
    return this.trans("object");
  }
}
