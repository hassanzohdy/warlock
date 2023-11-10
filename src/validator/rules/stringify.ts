import { isNumeric } from "@mongez/supportive-is";
import { Rule } from "./rule";

export class StringifyRule extends Rule {
  /**
   * Rule name
   */
  public static ruleName = "stringify";

  /**
   * Validate the rule
   */
  public async validate() {
    // check if can string or number only
    this.isValid = typeof this.value === "string" || isNumeric(this.value);
  }

  /**
   * Get error message
   */
  public error() {
    return this.trans("stringify");
  }
}
