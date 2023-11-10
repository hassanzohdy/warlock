import { Rule } from "./rule";

export class FileRule extends Rule {
  /**
   * Rule name
   */
  public static ruleName = "file";

  /**
   * Validate the rule
   */
  public async validate() {
    this.value = this.request.file(this.input);
    this.isValid = Boolean(this.value);
  }

  /**
   * Get error message
   */
  public error() {
    if (Array.isArray(this.value)) {
      return this.trans("files");
    }

    return this.trans("file");
  }
}
