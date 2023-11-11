import config from "@mongez/config";
import { sha1 } from "@mongez/encryption";
import { fileExists } from "@mongez/fs";
import { log } from "@mongez/logger";
import systemPath from "path";
import { Upload } from "../models/upload";
import { getWatermarkOptions } from "../utils/get-watermark-options";
import {
  downloadFromAWS,
  getAWSConfigurations,
  uploadToAWS,
} from "./../../../aws";
import { Request, Response } from "./../../../http";
import { Image } from "./../../../image";
import { cachePath } from "./../../../utils";

const setResponseCacheTime = (response: Response, cacheTime?: number) => {
  if (!cacheTime) return;

  // cache the file for 1 year
  response.header("Cache-Control", `public, max-age=${cacheTime}`);
  // set expires header to 1 year
  response.header(
    "Expires",
    new Date(Date.now() + cacheTime * 1000).toUTCString(),
  );
};

// TODO: Add Watermark options
export async function getUploadedFileUsingHash(
  request: Request,
  response: Response,
) {
  log("Bench", "loading", "upload", "info");
  const hash = request.input("hash");

  const upload = await Upload.findBy("hash", hash);

  log("Bench", "loaded", "upload", "success");
  if (!upload) {
    return response.notFound({
      error: "File not found",
      hashNotFound: true,
    });
  }

  const cacheTime = config.get("uploads.cacheTime", 31536000); // default is 1 year

  // check if uploaded is remote
  if (upload.get("isRemote")) {
    return responseFromAWS(request, response, upload, cacheTime);
  }

  const fullPath = upload.path;

  if (!fileExists(fullPath)) {
    return response.notFound({
      error: "File not found",
    });
  }

  setResponseCacheTime(response, cacheTime);

  const height = request.input("h");
  const width = request.input("w");
  const quality = request.input("q");

  if (height || width || quality) {
    const imageOptions = {
      height,
      width,
      quality,
    };

    const path = upload.get("path");

    const fileCachePathKey = sha1(
      JSON.stringify({
        imageOptions,
        path,
      }),
    );

    const cacheFullPath = cachePath(
      `images/${fileCachePathKey}${systemPath.extname(path)}`,
    );

    // make sure it is sent as an image using response header Content-Disposition
    response.header("Content-Disposition", "inline");

    if (fileExists(cacheFullPath)) {
      return response.sendFile(cacheFullPath);
    }

    try {
      const image = new Image(fullPath);

      image.resize(imageOptions);

      if (quality) {
        image.quality(parseInt(quality));
      }

      await image.save(cacheFullPath);

      return response.sendFile(cacheFullPath);
    } catch (error) {
      console.log("Error", error);

      return response.sendFile(fullPath);
    }
  }

  return response.sendFile(fullPath);
}

export async function responseFromAWS(
  request: Request,
  response: Response,
  upload: Upload,
  cacheTime?: number,
) {
  const provider = upload.get("provider");
  const url = provider.url;
  const awsConfigurations = await getAWSConfigurations();

  if (!awsConfigurations) {
    return response.notFound({
      error: "File not found",
      awsConfigurationsNotFound: true,
    });
  }

  if (upload.isImage === false) {
    const fileContent = await downloadFromAWS({
      fileName: provider.fileName,
      connectionOptions: awsConfigurations,
    });

    if (!fileContent) {
      return response.notFound({
        error: "File not found",
        fileNotFoundInAWS: true,
      });
    }

    setResponseCacheTime(response, cacheTime);

    return response.baseResponse.send(fileContent);
  }

  // now the image

  const width = request.input("w");
  const height = request.input("h");
  const quality = request.input("q");

  if (width || height || quality) {
    const fileCachePathKey = sha1(
      JSON.stringify({
        width,
        height,
        quality,
        url,
      }),
    );

    const cachedContent = await downloadFromAWS({
      fileName: fileCachePathKey,
      connectionOptions: awsConfigurations,
    });

    if (cachedContent) {
      setResponseCacheTime(response, cacheTime);

      // make sure it is sent as an image using response header Content-Disposition
      response.header("Content-Disposition", "inline");

      return response.baseResponse.send(cachedContent);
    }
  }

  const watermark = await getWatermarkOptions();

  // const watermarkHash = sha1(JSON.stringify(watermark || {}));

  const fileContent = await downloadFromAWS({
    fileName: provider.fileName,
    // fileName: provider.fileName + watermarkHash,
    connectionOptions: awsConfigurations,
  });

  if (!fileContent) {
    return response.notFound({
      error: "File not found",
    });
  }

  // now check again if there is a width, height or quality
  if (!width && !height && !quality) {
    setResponseCacheTime(response, cacheTime);

    // make sure it is sent as an image using response header Content-Disposition
    response.header("Content-Disposition", "inline");
    // ad the content type
    response.header("Content-Type", upload.get("mimeType"));

    return response.baseResponse.send(fileContent);
  }

  const fileCachePathKey = sha1(
    JSON.stringify({
      width,
      height,
      quality,
      url,
      // watermark: watermarkHash,
    }),
  );

  // now resize the image
  const image = new Image(fileContent);

  image.resize({
    width,
    height,
  });

  if (quality) {
    image.quality(parseInt(quality));
  }

  if (watermark) {
    const watermarkImage = await Upload.findBy("hash", watermark.hash);

    if (watermarkImage) {
      const content = watermarkImage.get("isRemote")
        ? await downloadFromAWS({
            fileName: watermarkImage.get("provider.fileName"),
            connectionOptions: awsConfigurations,
          })
        : watermarkImage.path;

      if (content) {
        image.watermark(content, {
          gravity: "",
          blend: "over",
        });
      }
    }
  }

  const resizedImage = await image.toBuffer();

  // make sure it is sent as an image using response header Content-Disposition

  response.header("Content-Disposition", "inline");

  // now upload the resized image to AWS but first send the response
  response.baseResponse.send(resizedImage);

  // now upload the resized image to AWS
  uploadToAWS({
    fileBuffer: resizedImage,
    hash: upload.get("hash"),
    mimeType: upload.get("mimeType"),
    connectionOptions: config.get("uploads.aws.connectionOptions"),
    fileName: fileCachePathKey,
    isCachedFile: true,
  });
}
