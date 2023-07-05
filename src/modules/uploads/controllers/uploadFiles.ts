import config from "@mongez/config";
import { Random } from "@mongez/reinforcements";
import dayjs from "dayjs";
import { Upload } from "../models";
import { Request, Response, UploadedFile } from "./../../../http";

export async function uploadFiles(request: Request, response: Response) {
  //
  const files = request.file("uploads");

  const uploads: Upload[] = [];

  const addFile = async (file: UploadedFile) => {
    const date = dayjs().format("DD-MM-YYYY");
    const hash = Random.string(64);
    const directoryPath = config.get("uploads.saveTo", date + "/" + hash);

    const fileName = file.name;
    const filePath = await file.saveAs(
      typeof directoryPath === "function" ? directoryPath() : directoryPath,
      fileName,
    ); // relative to uploadsPath

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
    }

    uploads.push(await Upload.create(fileData));
  };

  if (Array.isArray(files)) {
    for (const file of files) {
      await addFile(file);
    }
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
