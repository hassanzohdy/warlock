import { Casts, Model } from "@mongez/monpulse";
import { trim } from "@mongez/reinforcements";
import { UploadOutput } from "../output/upload-output";
import { copyUpload } from "../utils/copy-upload";
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
    directory: "string",
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
    const path = this.get("path");
    return uploadsPath(trim(path, "/"));
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

  /**
   * Get the hash value
   */
  public get hash(): string {
    return this.get("hash");
  }

  /**
   * Clone the uploaded file into a new different path
   */
  public async copy(saveTo?: string) {
    return copyUpload(this, saveTo);
  }
}

export const UploadBlueprint = Upload.blueprint();

export async function uploadsMigration() {
  await UploadBlueprint.index("hash");
  await UploadBlueprint.index("path");
}

uploadsMigration.down = async () => {
  await UploadBlueprint.dropIndex("hash");
  await UploadBlueprint.dropIndex("path");
};

uploadsMigration.blueprint = UploadBlueprint;
