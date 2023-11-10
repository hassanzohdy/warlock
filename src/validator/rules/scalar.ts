import { isScalar } from "@mongez/supportive-is";
import { Rule } from "./rule";

export class ScalarRule extends Rule {
  /**
   * Rule name
   */
  public static ruleName = "scalar";

  /**
   * Validate the rule
   */
  public async validate() {
    this.isValid = isScalar(this.value);
  }

  /**
   * Get error message
   */
  public error() {
    return this.trans("scalar");
  }
}
