import Is from "@mongez/supportive-is";
import { Rule } from "./rule";

export class UrlRule extends Rule {
  /**
   * Rule name
   */
  public static ruleName = "url";

  /**
   * Validate the rule
   */
  public async validate() {
    this.isValid = Is.url(this.value);
  }

  /**
   * Get error message
   */
  public error() {
    return this.trans("url");
  }
}
