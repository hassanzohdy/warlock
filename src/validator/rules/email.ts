import { isEmail } from "@mongez/supportive-is";
import { Rule } from "./rule";

export class EmailRule extends Rule {
  /**
   * Rule name
   */
  public static ruleName = "email";

  /**
   * Validate the rule
   */
  public async validate() {
    this.isValid = isEmail(this.value);
  }

  /**
   * Get error message
   */
  public error() {
    return this.trans("email");
  }
}
