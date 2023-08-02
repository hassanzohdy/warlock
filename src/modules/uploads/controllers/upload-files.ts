import config from "@mongez/config";
import { fileSize } from "@mongez/fs";
import { Random } from "@mongez/reinforcements";
import dayjs from "dayjs";
import { Request, Response, UploadedFile } from "../../../http";
import { uploadsPath } from "../../../utils";
import { Upload } from "../models";

export async function uploadFiles(request: Request, response: Response) {
  //
  const files = request.file("uploads");

  const uploads: Upload[] = [];

  const addFile = async (file: UploadedFile) => {
    const date = dayjs().format("DD-MM-YYYY");
    const hash = Random.string(64);
    const defaultDirectoryPath = date + "/" + hash;
    const directoryPath = config.get("uploads.saveTo", defaultDirectoryPath);

    const fileDirectoryPath =
      typeof directoryPath === "function"
        ? directoryPath(defaultDirectoryPath)
        : directoryPath;

    const fileName = file.name;
    const filePath = await file.saveAs(fileDirectoryPath, fileName); // relative to uploadsPath

    const fileData: any = {
      name: file.name,
      fileHash: file.hash,
      hash: hash,
      path: filePath,
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
  };

  const uploadedFiles: any[] = [];

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
    uploads: ["required"],
  },
};
