import { removePath } from "@mongez/fs";
import path from "path";
import { Upload } from "../models";
import {
  AWSConnectionOptions,
  getAWSConfigurations,
  uploadToAWS,
} from "./../../../aws";
import { uploadsPath } from "./../../../utils";

export async function uploadFileToAWS(file: Upload) {
  const awsOptions = await getAWSConfigurations();

  if (!awsOptions) return;

  // if the file is chunked, then we'll do it after the file is saved in database
  // in that case use uploadFileToAWSInBackground
  if (file.get("chunked")) return;

  await toAWS(file, awsOptions);
}

export async function uploadFileToAWSInBackground(file: Upload) {
  const awsOptions = await getAWSConfigurations();

  if (!awsOptions) return;

  // if the file is chunked, then skip it
  if (!file.get("chunked")) return;

  await toAWS(file, awsOptions);

  file.silentSaving();
}

async function toAWS(file: Upload, awsOptions: AWSConnectionOptions) {
  try {
    const uploadData = await uploadToAWS({
      filePath: file.path,
      fileName: file.get("name"),
      hash: file.get("hash"),
      mimeType: file.get("mimeType"),
      connectionOptions: awsOptions,
    });

    if (uploadData) {
      file.set("isRemote", true);
      file.set("provider", uploadData);

      // now remove the file from the server

      const directoryPath = path.dirname(String(file.get("path")));

      removePath(uploadsPath(directoryPath));
    }
  } catch (error) {
    console.log(error);
  }
}
