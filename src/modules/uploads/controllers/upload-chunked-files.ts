import config from "@mongez/config";
import { ensureDirectory, extension, fileSize, touch } from "@mongez/fs";
import { Random } from "@mongez/reinforcements";
import dayjs from "dayjs";
import fs from "fs";
import { Upload } from "../models";
import { Request, Response, UploadedFile } from "./../../../http";
import { uploadsPath } from "./../../../utils";

const uploadedFiles = new Map();

export async function uploadChunkedFiles(request: Request, response: Response) {
  const fileId = request.input("fileId");
  const chunkNumber = request.int("chunkNumber");
  const chunkFile = request.file("chunk") as UploadedFile | null;
  const fileName = request.input("fileName");

  if (!chunkFile) {
    return response.badRequest({
      error: "chunk is required",
    });
  }

  if (!uploadedFiles.has(fileId)) {
    const date = dayjs().format("DD-MM-YYYY");
    const hash = Random.string(64);
    const defaultDirectoryPath = date + "/" + hash;
    const directoryPath = config.get("uploads.saveTo", defaultDirectoryPath);

    const fileDirectoryPath =
      typeof directoryPath === "function"
        ? directoryPath(defaultDirectoryPath)
        : directoryPath;

    ensureDirectory(uploadsPath(fileDirectoryPath));
    touch(uploadsPath(fileDirectoryPath) + "/" + fileName);

    uploadedFiles.set(fileId, {
      chunks: [],
      directoryPath: fileDirectoryPath,
      filePath: uploadsPath(fileDirectoryPath) + "/" + fileName,
      fileSize: request.int("fileSize"),
      fileName: request.input("fileName"),
      fileType: request.input("fileType"),
      totalChunks: request.int("totalChunks"),
      hash,
    });
  }

  const fileChunks = uploadedFiles.get(fileId);

  fileChunks.chunks[chunkNumber] = {
    chunkNumber,
    file: chunkFile,
    currentChunkSize: request.int("currentChunkSize"),
  };

  // store the file chunk into the file by appending the buffer to the file

  if (fileChunks.chunks.length === fileChunks.totalChunks) {
    // now we can merge the chunks
    // and save the file
    await appendChunkToFile(fileChunks, chunkFile);
    // now create the upload record

    const fileData: any = {
      name: fileChunks.fileName,
      hash: fileChunks.hash,
      path: fileChunks.filePath.replace(uploadsPath("/"), ""),
      size: fileSize(fileChunks.filePath),
      mimeType: fileChunks.fileType,
      extension: extension(fileChunks.fileName),
      chunked: true,
    };

    if (chunkFile.isImage) {
      const { width, height } = await chunkFile.dimensions();
      fileData.width = width;
      fileData.height = height;
    }

    const upload = await Upload.create(fileData);

    // now remove the file from the map
    uploadedFiles.delete(fileId);

    return response.success({
      upload,
    });
  }

  response.success();
  appendChunkToFile(fileChunks, chunkFile);
}

export async function appendChunkToFile(fileChunks: any, file: UploadedFile) {
  // now append the buffer to the file
  const fileBuffer = await file.buffer();

  await fs.promises.appendFile(fileChunks.filePath, fileBuffer);
}
