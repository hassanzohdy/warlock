import { isEmpty } from "@mongez/supportive-is";
import { Rule } from "./rule";

export class RequiredRule extends Rule {
  /**
   * Rule name
   */
  public static ruleName = "required";

  /**
   * {@inheritdoc}
   */
  public requiresValue = false;

  /**
   * Validate the rule
   */
  public async validate() {
    this.isValid = !isEmpty(this.value);
  }

  /**
   * Get error message
   */
  public error() {
    return this.trans("required");
  }
}
