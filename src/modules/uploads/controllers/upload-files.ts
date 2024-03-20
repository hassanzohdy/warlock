import { fileSize } from "@mongez/fs";
import { Random, ltrim } from "@mongez/reinforcements";
import { Request, Response, UploadedFile } from "../../../http";
import { uploadsPath } from "../../../utils";
import { Upload } from "../models";
import { getUploadsDirectory } from "../utils/get-uploads-directory";

export async function uploadFiles(request: Request, response: Response) {
  const files = request.file("uploads");

  const directory = request.input("directory");

  const uploads: Upload[] = [];

  const isRandom = request.bool("random");

  const baseDirectoryPath = await getUploadsDirectory(directory);

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
      path: ltrim(filePath, "/"),
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
    uploads: ["required", "array", "file"],
    directory: ["string"],
    random: ["boolean"],
  },
};
