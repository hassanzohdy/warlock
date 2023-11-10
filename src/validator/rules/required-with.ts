import { isEmpty } from "@mongez/supportive-is";
import { Rule } from "./rule";

/**
 * Required with rule
 * The field under validation must be present and not empty only if any of the other specified fields are present and not empty.
 *
 * @Example {
 *  name: ['requiredIf:email,phone']
 * }
 */
export class RequiredWithRule extends Rule {
  /**
   * Rule name
   */
  public static ruleName = "requiredWith";

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

    const otherInputs = this.options[0];

    if (!otherInputs) return;

    let otherInputsAreValid = true;

    for (const input of otherInputs.split(",")) {
      const otherInputValue = this.request.input(input);

      if (isEmpty(otherInputValue)) {
        otherInputsAreValid = false;
        break;
      }
    }

    this.isValid = otherInputsAreValid;
  }

  /**
   * Get error message
   */
  public error() {
    return this.trans("required");
  }
}
