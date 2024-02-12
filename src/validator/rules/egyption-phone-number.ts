import { Rule } from "./rule";

export class EgyptianPhoneNumberRule extends Rule {
  /**
   * Rule name
   */
  public static ruleName = "egyptianPhoneNumber";

  /**
   * Validate the rule
   */
  public async validate() {
    // Regular expression to validate Egyptian phone numbers starting with 0
    const regex = /^(0)(10|11|12|14|15|16|17|18|19)[0-9]{8}$/;
    this.isValid = regex.test(this.value);
  }

  /**
   * Get error message
   */
  public error() {
    return this.trans("egyptianPhoneNumber");
  }
}
