import { Upload } from "../../modules";
import { Rule } from "./rule";

export class UploadableRule extends Rule {
  /**
   * Rule name
   */
  public static ruleName = "uploadable";

  /**
   * Validate the rule
   */
  public async validate() {
    // Check if the value is a file
    if (Array.isArray(this.value)) {
      for (const item of this.value) {
        if (!(await this.checkIfFile(item))) {
          this.isValid = false;
          break;
        }
      }
      this.isValid = true;
    }

    this.isValid = (await this.checkIfFile(this.value)) ? true : false;
  }

  protected async checkIfFile(hash: any) {
    if (!hash || !hash.value) return false;

    if (hash?.value) {
      return (await Upload.findBy("hash", hash.value)) ? true : false;
    }

    return (await Upload.findBy("hash", hash)) ? true : false;
  }
  /**
   * Get error message
   */
  public error() {
    return this.trans("uploadable");
  }
}
