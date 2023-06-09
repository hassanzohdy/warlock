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
   * Make the output minimal by removing unnecessary keys
   * This should be used in a middleware to interrupt the request and define the keys to be removed
   * If it is in a front-office app, it should be removing all of these to reduce the size of the response
   */
  public static makeItMinimal(
    removingKeys = ["size", "id", "extension", "mimeType", "hash"],
  ) {
    this.disabledKeys = removingKeys;

    return this;
  }
}
