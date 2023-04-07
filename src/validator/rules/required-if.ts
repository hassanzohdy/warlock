import Is from "@mongez/supportive-is";
import Rule from "./rule";

export default class RequiredIfRule extends Rule {
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
    const hasValue = !Is.empty(this.value);

    if (hasValue) {
      this.isValid = true;
      return;
    }

    const otherInputs = this.options[0];

    if (!otherInputs) return;

    let otherInputsAreValid = true;

    for (const input of otherInputs.split(",")) {
      const otherInputValue = this.request.input(input);

      if (Is.empty(otherInputValue)) {
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
