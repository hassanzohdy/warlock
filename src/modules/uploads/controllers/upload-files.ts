import config from "@mongez/config";
import { fileSize } from "@mongez/fs";
import { Random } from "@mongez/reinforcements";
import dayjs from "dayjs";
import { Request, Response, UploadedFile } from "../../../http";
import { uploadsPath } from "../../../utils";
import { Upload } from "../models";

async function getDirectory(directoryInput?: string) {
  if (directoryInput) return directoryInput;

  const configDirectory = config.get("uploads.saveTo");

  if (configDirectory) {
    if (typeof configDirectory === "function") {
      return await configDirectory();
    }

    return configDirectory;
  }

  return dayjs().format("DD-MM-YYYY");
}

export async function uploadFiles(request: Request, response: Response) {
  const files = request.file("uploads");

  const directory = request.input("directory");

  const uploads: Upload[] = [];

  const isRandom = request.bool("random");

  const baseDirectoryPath = getDirectory(directory);

  const addFile = async (file: UploadedFile) => {
    const hash = Random.string(64);
    const fileDirectoryPath = baseDirectoryPath + "/" + hash;

    const fileName = file.name;
    const filePath = isRandom
      ? await file.save(fileDirectoryPath)
      : await file.saveAs(fileDirectoryPath, fileName); // relative to uploadsPath

    const fileData: any = {
      name: file.name,
      fileHash: file.hash,
      hash: hash,
      path: filePath,
      directory: fileDirectoryPath,
      size: fileSize(uploadsPath(filePath)),
      mimeType: file.mimeType,
      extension: file.extension,
    };

    if (file.isImage) {
      const { width, height } = await file.dimensions();
      fileData.width = width;
      fileData.height = height;
    }

    const upload = new Upload(fileData);

    await upload.save();

    uploads.push(upload);

    return upload;
  };

  const uploadedFiles: Promise<Upload>[] = [];

  if (Array.isArray(files)) {
    for (const file of files) {
      uploadedFiles.push(addFile(file));
    }

    await Promise.all(uploadedFiles);
  } else {
    await addFile(files as UploadedFile);
  }

  return response.success({
    uploads,
  });
}

uploadFiles.validation = {
  rules: {
    uploads: ["required", "file"],
    directory: ["string"],
    random: ["boolean"],
  },
};
