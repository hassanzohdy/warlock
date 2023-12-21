import { isEmpty } from "@mongez/supportive-is";
import { Rule } from "./rule";

/**
 * The field under validation must be present and not empty if the another field is empty
 *
 * @example creditCardNumber: ["requiredIfEmpty:paymentType"]
 */
export class RequiredIfEmptyRule extends Rule {
  /**
   * Rule name
   */
  public static ruleName = "requiredIfEmpty";

  /**
   * {@inheritdoc}
   */
  public requiresValue = false;

  /**
   * Validate the rule
   */
  public async validate() {
    const hasValue = !isEmpty(this.value);

    if (hasValue) {
      this.isValid = true;
      return;
    }

    const [otherInput] = this.options;

    const otherInputValue = this.request.input(otherInput);

    this.isValid = !isEmpty(otherInputValue);
  }

  /**
   * Get error message
   */
  public error() {
    return this.trans("required");
  }
}
