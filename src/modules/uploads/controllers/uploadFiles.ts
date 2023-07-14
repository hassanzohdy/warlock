import config from "@mongez/config";
import { fileSize, removePath } from "@mongez/fs";
import { Random, removeFirst } from "@mongez/reinforcements";
import dayjs from "dayjs";
import { Upload } from "../models";
import { UploadsConfigurations } from "../utils";
import { uploadToAWS } from "./../../../aws";
import { Request, Response, UploadedFile } from "./../../../http";
import { Image } from "./../../../image";
import { uploadsPath } from "./../../../utils";

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
      size: await file.size(),
      mimeType: file.mimeType,
      extension: file.extension,
    };

    if (file.isImage) {
      const { width, height } = await file.dimensions();

      fileData.width = width;
      fileData.height = height;

      if (config.get("uploads.compress")) {
        // convert the image to webp
        const fullFilePath = uploadsPath(filePath);
        const image = new Image(fullFilePath);

        // replace the end of the file path with .webp
        const newPath = fullFilePath.replace(/(\.[a-zA-Z0-9]+)$/, ".webp");

        await image.saveAsWebp(newPath);

        // now update the fileData Object
        fileData.path = removeFirst(newPath, uploadsPath("/"));
        fileData.name = fileData.name.replace(/(\.[a-zA-Z0-9]+)$/, ".webp");
        fileData.mimeType = "image/webp";
        fileData.extension = "webp";
        fileData.size = fileSize(newPath);
      }
    }

    const upload = new Upload(fileData);

    const awsOptions = config.get("uploads.aws") as
      | UploadsConfigurations["aws"]
      | undefined;

    if (awsOptions) {
      const url = await uploadToAWS({
        filePath: upload.path,
        fileName: upload.get("name"),
        hash,
        mimeType: file.mimeType,
        ...awsOptions,
      });

      upload.set("url", url);
      upload.set("isRemote", true);
      upload.set("provider", "aws");

      // now remove the file from the server
      removePath(uploadsPath(fileDirectoryPath));
    }

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
