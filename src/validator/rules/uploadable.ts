import { Upload } from "../../modules/uploads/models/upload";
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
      const totalUploads = await Upload.aggregate()
        .whereIn("hash", this.value)
        .count();

      this.isValid = totalUploads === this.value.length;
    } else {
      this.isValid = await this.checkIfFile(this.value);
    }
  }

  protected async checkIfFile(hash: any) {
    if (hash?.value) {
      return Boolean(await Upload.findBy("hash", hash.value));
    }

    return Boolean(await Upload.findBy("hash", hash));
  }
  /**
   * Get error message
   */
  public error() {
    return this.trans("uploadable");
  }
}
