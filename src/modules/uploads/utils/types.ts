import type { AWSConfigurations } from "../../../aws";
import { Request } from "../../../http";
import type { UploadOutput } from "../output/upload-output";

export type WatermarkOptions = {
  hash: string;
  ratio?: number;
  position?:
    | "center"
    | "center-center"
    | "center-right"
    | "center-left"
    | "top-left"
    | "top-right"
    | "top-center"
    | "bottom-left"
    | "bottom-right"
    | "bottom-center";
  opacity?: number;
};

export type UploadsConfigurations = {
  /**
   * Set the uploads path that is related to the uploads directory
   * The path is RELATIVE to the uploads directory, do not include the uploads directory in the path
   *
   * @default date/hash
   */
  saveTo?: string | ((defaultPath: string) => string);
  /**
   * Uploads directory
   */
  root?: string | ((relativePath: string) => string);
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
  /**
   * Aws Configurations
   */
  aws?: AWSConfigurations;
  /**
   * Compress images
   *
   * @default true
   */
  compress?: boolean;
  /**
   * Add watermark to images
   */
  watermark?: (request: Request) => Promise<WatermarkOptions>;
};
