import type { UploadOutput } from "../output/upload-output";

export type UploadsConfigurations = {
  /**
   * Set the uploads path that is related to the uploads directory
   * The path is RELATIVE to the uploads directory, do not include the uploads directory in the path
   *
   * @default date/hash
   */
  saveTo?: string | ((defaultPath: string) => string);
  /**
   * Modify upload output before sending it to response
   */
  extend?: (upload: UploadOutput) => any;
  /**
   * Cache files in seconds
   *
   * @default 31536000 (1 year)
   */
  cacheTime?: number;
};
