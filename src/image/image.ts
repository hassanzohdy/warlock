import Endpoint from "@mongez/http";
import sharp from "sharp";

export class Image {
  /**
   * More options
   */
  protected options: any = {};

  /**
   * Sharp image object
   */
  public readonly image: sharp.Sharp;

  /**
   * Constructor
   */
  public constructor(image: Parameters<typeof sharp>[0]) {
    this.image = sharp(image);
  }

  /**
   * Set image opacity
   */
  public opacity(opacity: number) {
    if (opacity < 0 || opacity > 100) {
      throw new Error("Opacity must be between 0 and 100");
    }

    const alpha = Math.round((opacity / 100) * 255);
    const alphaPixel = Buffer.from([255, 255, 255, alpha]);

    this.image.composite([
      {
        blend: "dest-in",
        input: alphaPixel,
      },
    ]);

    return this;
  }

  /**
   * Get image dimensions
   */
  public async dimensions() {
    const { width, height } = await this.image.metadata();

    return { width, height };
  }

  /**
   * Get image metadata
   */
  public async metadata() {
    return this.image.metadata();
  }

  /**
   * Create image instance from url
   */
  public static async fromUrl(url: string) {
    // download image from url as buffer
    const request = new Endpoint();
    const response = await request.get(url, {
      responseType: "arraybuffer",
    });

    const buffer = Buffer.from(response.data, "binary");

    return new Image(buffer);
  }

  /**
   * Resize image
   */
  public resize(options: sharp.ResizeOptions) {
    this.image.resize(options);

    return this;
  }

  /**
   * Set image quality
   */
  public quality(quality: number) {
    this.image.webp({
      quality,
    });

    return this;
  }

  /**
   * Save to file
   */
  public async save(path: string) {
    return this.image.toFile(path);
  }

  /**
   * Add watermark
   */
  public async watermark(
    watermarkImage: string | Image,
    options: sharp.OverlayOptions = {},
  ) {
    if (typeof watermarkImage === "string") {
      watermarkImage = new Image(watermarkImage);
    }

    this.image.composite([
      {
        input: await watermarkImage.toBuffer(),
        ...options,
      },
    ]);

    return this;
  }

  /**
   * Rotate image
   */
  public rotate(angle: number) {
    this.image.rotate(angle);

    return this;
  }

  /**
   * Blur image
   */
  public blur(sigma: number) {
    this.image.blur(sigma);

    return this;
  }

  /**
   * Convert to base64
   */
  public async toBase64() {
    const buffer = await this.image.toBuffer();

    return buffer.toString("base64");
  }

  /**
   * Sharpen image
   */
  public sharpen(options?: sharp.SharpenOptions) {
    this.image.sharpen(options);

    return this;
  }

  /**
   * Convert to buffer
   */
  public toBuffer() {
    return this.image.toBuffer();
  }
}
