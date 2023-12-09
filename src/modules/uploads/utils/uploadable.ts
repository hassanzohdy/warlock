import config from "@mongez/config";
import { copyFile, ensureDirectory } from "@mongez/fs";
import Endpoint from "@mongez/http";
import { Model } from "@mongez/monpulse";
import { GenericObject, Random, trim } from "@mongez/reinforcements";
import { isUrl } from "@mongez/supportive-is";
import { AxiosResponse } from "axios";
import dayjs from "dayjs";
import { writeFileSync } from "fs";
import path from "path";
import { Upload } from "../models";
import { Image } from "./../../../image";
import { sanitizePath, uploadsPath } from "./../../../utils";
import { File } from "./file";

export async function uploadFromFile(file: File) {
  const date = dayjs().format("DD-MM-YYYY");

  const hash = Random.string(32);

  const filePath = file.name;

  const uploadPath = uploadsPath(date + "/" + hash);

  ensureDirectory(uploadPath);

  copyFile(file.path, path.resolve(uploadPath + "/" + filePath));

  const fileData = {
    name: file.name,
    fileHash: file.hash,
    hash: hash,
    path: date + "/" + hash + "/" + filePath,
    size: file.size,
    mimeType: file.mimeType,
    extension: file.extension,
  };

  // check if file is image
  const isImage = String(file.mimeType).startsWith("image");

  if (isImage) {
    // get image dimensions
    const image = new Image(file.path);

    const { width, height } = await image.dimensions();

    (fileData as any)["width"] = width;
    (fileData as any)["height"] = height;
  }

  return Upload.create(fileData);
}

async function getUpload(hash: any) {
  if (!hash) return null;

  if (hash instanceof Upload) return hash;

  if (isUrl(hash)) {
    return await uploadFromUrl(hash);
  }

  if (hash instanceof File) {
    return await uploadFromFile(hash);
  }

  return await Upload.findBy("hash", hash);
}

async function getDirectory() {
  const configDirectory = config.get("uploads.saveTo");

  const hash = Random.string(32);

  const path = dayjs().format("DD-MM-YYYY") + "/" + hash;

  if (configDirectory) {
    if (typeof configDirectory === "function") {
      return await configDirectory(path);
    }

    return configDirectory;
  }

  return path;
}
export async function uploadFromUrl(url: string) {
  const urlHandler = new URL(url);
  // get file name from url
  const fileName =
    sanitizePath(trim(String(urlHandler?.pathname?.split("/")?.pop()), "/")) ||
    Random.string(32);

  const fileExtension = fileName.split(".").pop();

  const hash = Random.string(32);

  // file path should be date/hash/file.extension
  // const filePath = fileName + "." + fileExtension;
  const filePath = fileName;

  const directoryPath = await getDirectory();

  const uploadPath = uploadsPath(directoryPath);

  ensureDirectory(uploadPath);

  const request = new Endpoint({ baseURL: "" });

  const response: AxiosResponse = await request.get(url, {
    responseType: "arraybuffer",
  });

  const fileContent = response.data;

  // get file size in bytes
  const fileSize = Buffer.byteLength(fileContent);

  // get file mime type
  const fileMimeType = response.headers["content-type"];

  const fullPath = uploadPath + "/" + filePath;

  writeFileSync(fullPath, fileContent);

  const fileData = {
    name: fileName,
    hash: hash,
    path: directoryPath + "/" + filePath,
    size: fileSize,
    mimeType: fileMimeType,
    extension: fileExtension,
  };

  // check if file is image
  const isImage = String(fileData.mimeType).startsWith("image");

  if (isImage) {
    // get image dimensions
    const image = new Image(fullPath);

    const { width, height } = await image.dimensions();

    (fileData as any)["width"] = width;
    (fileData as any)["height"] = height;
  }

  return Upload.create(fileData);
}

/**
 * Create an uploadable files but with additional data
 */
export function uploadableExtended(
  options: GenericObject | ((model: Model) => GenericObject) = {},
) {
  return async function uploadable(
    hash: any,
    column: string,
    model: Model,
    sync = true,
  ): Promise<any> {
    if (Array.isArray(hash)) {
      const value = await Promise.all(
        hash.map(
          async (item: any) => await uploadable(item, column, model, false),
        ),
      );

      if (sync) {
        // link the model to the upload
        syncModelWithUpload(model, column, value);
      }
    }

    if (hash?.value) {
      hash.value = (await getUpload(hash.value))?.embeddedData;

      return hash;
    }

    const upload = await getUpload(hash);

    if (!upload) return null;

    if (typeof options === "function") {
      options = options(model);
    }

    upload.merge(options as GenericObject).silentSaving();

    if (sync) {
      // link the model to the upload
      syncModelWithUpload(model, column, upload.hash);
    }

    return {
      ...upload.embeddedData,
      ...options,
    };
  };
}

/**
 * Casts a value to an uploadable object.
 * If the value is an array, it will return an array of uploadable objects.
 */
export async function uploadable(
  hash: any,
  column: string,
  model: Model,
  sync = true,
): Promise<any> {
  if (Array.isArray(hash)) {
    const value = await Promise.all(
      hash.map(
        async (item: any) => await uploadable(item, column, model, false),
      ),
    );

    if (sync) {
      // link the model to the upload
      syncModelWithUpload(
        model,
        column,
        value.map(value => value.hash),
      );
    }

    return value;
  }

  if (hash?.value) {
    hash.value = (await getUpload(hash.value))?.embeddedData;

    return hash;
  }

  const upload = await getUpload(hash);

  if (!upload) return null;

  if (sync) {
    // link the model to the upload
    syncModelWithUpload(model, column, upload.hash);
  }

  return upload.embeddedData;
}

async function syncModelWithUpload(
  model: Model,
  column: string,
  hash: string | string[],
) {
  model.set("_uploads." + column, hash);
}
