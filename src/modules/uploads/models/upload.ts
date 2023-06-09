import { Casts, Model } from "@mongez/mongodb";
import { UploadOutput } from "../output/upload-output";

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
  };

  /**
   * {@inheritDoc}
   */
  public embedded = [
    "id",
    "name",
    "path",
    "extension",
    "size",
    "fileHash",
    "hash",
    "mimeType",
    "width",
    "height",
  ];
}
