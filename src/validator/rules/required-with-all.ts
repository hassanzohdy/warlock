import { isEmpty } from "@mongez/supportive-is";
import { Rule } from "./rule";

/**
 * Required with rule
 * The field under validation must be present and not empty only if all of the other specified fields are present and not empty.
 *
 * @Example {
 *  name: ['requiredIf:email,phone']
 * }
 */
export class RequiredWithAllRule extends Rule {
  /**
   * Rule name
   */
  public static ruleName = "requiredWithAll";

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

    const otherInputs = this.options;

    if (otherInputs.length === 0) return;

    // the  input will be marked as valid
    // if all of the other inputs has a value
    this.isValid = otherInputs.every(otherInput => {
      const otherInputValue = this.request.input(otherInput);

      return !isEmpty(otherInputValue);
    });
  }

  /**
   * Get error message
   */
  public error() {
    return this.trans("required");
  }
}
