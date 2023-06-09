import { sha1 } from "@mongez/encryption";
import { fileExists } from "@mongez/fs";
import systemPath from "path";
import { Request, Response } from "./../../../http";
import { Image } from "./../../../image";
import { cachePath, uploadsPath } from "./../../../utils";

export async function getUploadedFile(request: Request, response: Response) {
  const path = request.input("*");

  const fullPath = uploadsPath(path);

  if (!fileExists(fullPath)) {
    return response.notFound({
      error: "File not found",
    });
  }

  // cache the file for 1 year
  response.header("Cache-Control", "public, max-age=31536000");
  // set expires header to 1 year
  response.header("Expires", new Date(Date.now() + 31536000000).toUTCString());

  const height = request.input("h");
  const width = request.input("w");
  const quality = request.input("q");

  if (height || width || quality) {
    const imageOptions = {
      height,
      width,
      quality,
    };

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
