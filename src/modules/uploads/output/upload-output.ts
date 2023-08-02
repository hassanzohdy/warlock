import config from "@mongez/config";
import { getAWSConfig } from "../../../aws";
import { FinalOutput, Output } from "../../../output";

export class UploadOutput extends Output {
  /**
   * Disabled keys from being returned in the final output
   */
  protected static disabledKeys: string[] = [];

  /**
   * The only allowed keys
   */
  protected static allowedKeys: string[] = [];

  /**
   * Output data
   */
  protected output: FinalOutput = {
    name: "string",
    hash: "string",
    mimeType: "string",
    extension: "string",
    size: "number",
    url: ["path", "uploadsUrl"],
    id: ["hash", "string"],
    width: "number",
    height: "number",
  };

  /**
   * Defaults when key is missing from resource
   */
  protected defaults = {};

  /**
   * {@inheritDoc}
   */
  protected async extend() {
    if (this.get("provider.url")) {
      const cloudfront = await getAWSConfig("cloudfront");
      if (cloudfront) {
        this.set("url", cloudfront + "/" + this.get("provider.fileName"));
      } else {
        this.set("url", this.get("provider.url"));
      }
    }

    await config.get("uploads.extend", () => {
      //
    })(this);
  }
}
