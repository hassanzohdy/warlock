import { isEmpty } from "@mongez/supportive-is";
import { Rule } from "./rule";

/**
 * The field under validation must be present and not empty if the another field field is equal to any value.
 *
 * @example creditCardNumber: ["requiredIf:paymentType,card"]
 */
export class RequiredIfRule extends Rule {
  /**
   * Rule name
   */
  public static ruleName = "requiredIf";

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

    const [otherInput, expectedValue] = this.options;

    const otherInputValue = this.request.input(otherInput);

    if (isEmpty(otherInputValue)) return;

    this.isValid = otherInputValue === expectedValue;
  }

  /**
   * Get error message
   */
  public error() {
    return this.trans("required");
  }
}
