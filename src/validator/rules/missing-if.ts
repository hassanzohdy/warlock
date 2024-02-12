import { isEmpty } from "@mongez/supportive-is";
import { Rule } from "./rule";

/**
 * The field under validation must be not present or empty if the another field is equal to any value.
 *
 * @example creditCardNumber: ["missingIf:paymentType,card"]
 */
export class MissingIfRule extends Rule {
  /**
   * Rule name
   */
  public static ruleName = "missingIf";

  /**
   * {@inheritdoc}
   */
  public requiresValue = false;

  /**
   * Validate the rule
   */
  public async validate() {
    // the workflow as follows:
    // if current input's value is present and the given input's value is equal to any of the expected values
    // then it will be marked as invalid
    // otherwise, it will be marked as valid

    const [otherInput, ...inputValues] = this.options;

    const otherInputValue = this.request.input(otherInput);

    this.isValid =
      isEmpty(this.value) || !inputValues.includes(otherInputValue);
  }

  /**
   * Get error message
   */
  public error() {
    return this.trans("missing");
  }

  /**
   * {@inheritDoc}
   */
  public toJson() {
    const [input, ...values] = this.options;

    if (values.length === 1) {
      return `Missing If ${input} equals '${values[0]}'`;
    }

    return `Missing If ${input} equals one of: '${values.join("', '")}'`;
  }
}
