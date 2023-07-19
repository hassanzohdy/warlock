import { Casts, Model } from "@mongez/monpulse";
import { UploadOutput } from "../output/upload-output";
import { uploadsPath } from "./../../../utils";
export class Upload extends Model {
  /**
   * Collection name
   */
  public static collection = "uploads";

  /**
   * {@inheritDoc}
   */
  public static output = UploadOutput;

  /**
   * {@inheritDoc}
   */
  protected casts: Casts = {
    name: "string",
    path: "string",
    extension: "string",
    size: "number",
    fileHash: "string",
    hash: "string",
    mimeType: "string",
    width: "number",
    height: "number",
    url: "string",
    provider: "object",
    isRemote: "boolean",
    chunked: "boolean",
  };

  /**
   * {@inheritDoc}
   */
  public embedded = Object.keys(this.casts);

  /**
   * Get file full path
   */
  public get path() {
    return uploadsPath(this.get("path"));
  }

  /**
   * Determine if file is an image
   */
  public get isImage() {
    return this.get("mimeType").startsWith("image/");
  }

  /**
   * Determine if file is a video
   */
  public get isVideo() {
    return this.get("mimeType").startsWith("video/");
  }

  /**
   * Determine if file is a PDF
   */
  public get isPDF() {
    return this.get("mimeType") === "application/pdf";
  }
}

export const UploadBluePrint = Upload.blueprint();

export async function uploadsMigration() {
  await UploadBluePrint.index("hash");
  await UploadBluePrint.index("path");
}

uploadsMigration.down = async function () {
  await UploadBluePrint.dropIndex("hash");
  await UploadBluePrint.dropIndex("path");
};

uploadsMigration.blueprint = UploadBluePrint;
