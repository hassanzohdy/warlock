import { fileSize, getFile } from "@mongez/fs";
import crypto from "crypto";
import mime from "mime";
import pathSystem from "path";

export class File {
  /**
   * Cached file contents
   */
  protected _contents?: string;

  /**
   * Constructor
   */
  public constructor(public path: string) {
    //
    this.path = pathSystem.resolve(path);
  }

  /**
   * Get file contents, and cache it
   */
  public get contents() {
    if (!this._contents) {
      this._contents = getFile(this.path);
    }

    return this._contents;
  }

  /**
   * Get file name
   */
  public get name() {
    return pathSystem.basename(this.path);
  }

  /**
   * Get file extension
   */
  public get extension() {
    return pathSystem.extname(this.path);
  }

  /**
   * Get file size
   */
  public get size() {
    return fileSize(this.path);
  }

  /**
   * Get file mime type
   */
  public get mimeType() {
    return mime.getType(this.path);
  }

  /**
   * Get file hash
   */
  public get hash() {
    return crypto.createHash("sha256").update(this.contents).digest("hex");
  }
}
