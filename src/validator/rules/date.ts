import { Rule } from "./rule";

export class DateRule extends Rule {
  /**
   * Rule name
   */
  public static ruleName = "date";

  /**
   * Validate the rule
   */
  public async validate() {
    // Parse the input value as a Date object
    const inputDate = new Date(this.value);

    // Check if the parsed date is valid and not NaN
    this.isValid = !isNaN(inputDate.getTime());
  }

  /**
   * Get error message
   */
  public error() {
    return this.trans("date");
  }
}
