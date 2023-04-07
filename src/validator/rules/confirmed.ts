import { toStudlyCase } from "@mongez/reinforcements";
import { Rule } from "./rule";

export class ConfirmedRule extends Rule {
  /**
   * Rule name
   */
  public static ruleName = "confirmed";

  /**
   * Confirmation input name
   */
  protected confirmationInput = "";

  /**
   * Validate the rule
   */
  public async validate() {
    this.confirmationInput = `confirm${toStudlyCase(this.input)}`;
    const confirmedInputValue = this.request.input(this.confirmationInput);

    this.isValid = this.value === confirmedInputValue;
  }

  /**
   * Get error message
   */
  public error() {
    return this.trans("confirmed", {
      confirmationInput: this.confirmationInput,
    });
  }
}
