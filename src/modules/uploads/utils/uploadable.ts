import { copyFile, ensureDirectory, putFile } from "@mongez/fs";
import Endpoint from "@mongez/http";
import { Model } from "@mongez/monpulse";
import { Random, trim } from "@mongez/reinforcements";
import Is from "@mongez/supportive-is";
import { AxiosResponse } from "axios";
import crypto from "crypto";
import dayjs from "dayjs";
import { createWriteStream } from "fs";
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

  if (Is.url(hash)) {
    return await uploadFromUrl(hash);
  }

  if (hash instanceof File) {
    return await uploadFromFile(hash);
  }

  return await Upload.findBy("hash", hash);
}

export async function downloadFile(
  fileUrl: string,
  outputLocationPath: string,
): Promise<AxiosResponse> {
  const fileName = crypto.randomBytes(16).toString("hex");
  const fileExtension = fileUrl.split(".").pop();
  const writer = createWriteStream(
    outputLocationPath + "/" + fileName + "." + fileExtension,
  );

  const request = new Endpoint({ baseURL: "" });

  return request
    .get(fileUrl, {
      responseType: "stream",
    })
    .then(response => {
      //ensure that the user can call `then()` only when the file has
      //been downloaded entirely.

      return new Promise((resolve, reject) => {
        response.data.pipe(writer);
        let error: any = null;
        writer.on("error", err => {
          error = err;
          writer.close();
          reject(err);
        });
        writer.on("close", () => {
          if (!error) {
            resolve(response);
          }
          //no need to call the reject here, as it will have been called in the
          //'error' stream;
        });
      });
    });
}

export async function uploadFromUrl(url: string) {
  const urlHandler = new URL(url);
  // get file name from url
  const fileName =
    sanitizePath(trim(String(urlHandler?.pathname?.split("/")?.pop()), "/")) ||
    Random.string(32);

  const fileExtension = fileName.split(".").pop();

  const date = dayjs().format("DD-MM-YYYY");

  const hash = Random.string(32);

  // file path should be date/hash/file.extension
  // const filePath = fileName + "." + fileExtension;
  const filePath = fileName;

  const uploadPath = uploadsPath(date + "/" + hash);

  ensureDirectory(uploadPath);

  const request = new Endpoint({ baseURL: "" });

  const response: AxiosResponse = await request.get(url);

  const fileContent = response.data;

  // get file size in bytes
  const fileSize = Buffer.byteLength(fileContent);

  // get file mime type
  const fileMimeType = response.headers["content-type"];

  const fullPath = uploadPath + "/" + filePath;

  putFile(fullPath, fileContent);

  const fileHash = crypto
    .createHash("sha256")
    .update(fileContent.toString())
    .digest("hex");

  const fileData = {
    name: fileName,
    fileHash: fileHash,
    hash: hash,
    path: date + "/" + hash + "/" + filePath,
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
 * Casts a value to an uploadable object.
 * If the value is an array, it will return an array of uploadable objects.
 */
export async function uploadable(
  hash: any,
  column: string,
  model: Model,
): Promise<any> {
  if (Array.isArray(hash)) {
    return await Promise.all(
      hash.map(async (item: any) => await uploadable(item, column, model)),
    );
  }

  if (hash?.value) {
    hash.value = (await getUpload(hash.value))?.embeddedData;

    return hash;
  }

  const upload = await getUpload(hash);

  // link the model to the upload
  syncModelWithUpload(model, upload, column);

  if (!upload) return null;

  return upload.embeddedData;
}

async function syncModelWithUpload(
  model: Model,
  upload: Upload | null,
  column: string,
) {
  if (!upload) return;

  const data = {
    collection: model.getCollection(),
    id: model.id || (await model.generateNextId()),
    column,
  };

  const syncedModels = upload.get("syncedModels") || [];

  if (
    !syncedModels.find(
      (item: any) =>
        item.id === data.id &&
        item.column === data.column &&
        item.collection === data.collection,
    )
  ) {
    syncedModels.push(data);

    upload.set("syncedModels", syncedModels);

    await upload.save();
  }
}
