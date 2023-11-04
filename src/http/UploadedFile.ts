import { MultipartFile } from "@fastify/multipart";
import { ensureDirectory } from "@mongez/fs";
import { Random } from "@mongez/reinforcements";
import crypto from "crypto";
import { writeFileSync } from "fs";
import path from "path";
import { Image } from "../image";
import { sanitizePath, uploadsPath } from "../utils/paths";

export class UploadedFile {
  /**
   * File buffered content
   */
  private bufferedFileContent?: Buffer;

  /**
   * Upload File Hash
   */
  public hash = "";

  /**
   * Save path for the file
   */
  protected savePath = "";

  /**
   * Determine if file is saved
   */
  protected isSaved = false;

  /**
   * Constructor
   */
  public constructor(private readonly fileData: MultipartFile) {
    //
  }

  /**
   * Get file name
   */
  public get name() {
    return sanitizePath(this.fileData.filename);
  }

  /**
   * Get file mime type
   */
  public get mimeType() {
    return this.fileData.mimetype;
  }

  /**
   * Get file extension
   */
  public get extension() {
    return path
      .extname(this.fileData.filename)
      .replace(".", "")
      .toLocaleLowerCase();
  }

  /**
   * Get file size in bytes
   */
  public async size() {
    const file = await this.buffer();

    return file.toString().length;
  }

  /**
   * Get file buffer
   */
  public async buffer() {
    if (this.bufferedFileContent) {
      return this.bufferedFileContent;
    }

    this.bufferedFileContent = await this.fileData.toBuffer();

    return this.bufferedFileContent;
  }

  /**
   * Check if file is an image
   */
  public get isImage() {
    return this.mimeType.startsWith("image");
  }

  /**
   * Get file width and height
   */
  public async dimensions() {
    return new Image(
      this.isSaved ? this.savePath : await this.buffer(),
    ).dimensions();
  }

  /**
   * Save file to the given path
   */
  public async saveTo(path: string) {
    return this.saveAs(path, this.name);
  }

  /**
   * Save the file to the given path with the given name
   */
  public async saveAs(path: string, name: string) {
    const relativeFilePath = this.getSavePath(path, name);

    const fileContent = await this.buffer();

    writeFileSync(this.savePath, fileContent);

    this.hash = crypto
      .createHash("sha256")
      .update(fileContent.toString())
      .digest("hex");

    this.isSaved = true;

    return relativeFilePath;
  }

  /**
   * Save the file to the given path with random generated name
   */
  public async save(path: string) {
    const name = Random.string(64) + "." + this.extension;

    return this.saveAs(path, name);
  }

  /**
   * Get save path for the given path and file name
   */
  public getSavePath(path: string, fileName: string) {
    const uploadPath = uploadsPath(path);

    ensureDirectory(uploadPath);

    const relativeFilePath = path + "/" + fileName;

    this.savePath = uploadsPath(relativeFilePath);

    return relativeFilePath;
  }
}
