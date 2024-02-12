import { UploadedFile } from "../../http";
import { Rule } from "./rule";

export class ImageRule extends Rule {
  /**
   * Rule name
   */
  public static ruleName = "image";

  /**
   * Validate the rule
   */
  public async validate() {
    this.value = this.request.file(this.input);
    const isValid = Boolean(this.value);

    if (!isValid) {
      this.isValid = false;
      return;
    }

    // now check if the file is an image
    if (Array.isArray(this.value)) {
      this.isValid = this.value.every((file: UploadedFile) => {
        return file.isImage;
      });
    } else {
      this.isValid = this.value.isImage;
    }
  }

  /**
   * Get error message
   */
  public error() {
    if (Array.isArray(this.value)) {
      return this.trans("images");
    }

    return this.trans("image");
  }

  /**
   * {@inheritDoc}
   */
  public expectedType() {
    return "file";
  }
}
