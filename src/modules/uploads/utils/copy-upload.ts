import { copyFileAsync, ensureDirectoryAsync } from "@mongez/fs";
import { Random } from "@mongez/reinforcements";
import { uploadsPath } from "../../../utils";
import { getUploadsDirectory } from "../controllers/upload-files";
import { Upload } from "../models";

export async function copyUpload(upload: Upload, saveTo?: string) {
  const hash = Random.string(64);
  const directory = (await getUploadsDirectory(saveTo)) + "/" + hash;
  const filePath = directory + "/" + upload.get("name");

  await ensureDirectoryAsync(uploadsPath(directory));
  await copyFileAsync(upload.path, uploadsPath(filePath));

  return await Upload.create({
    ...upload.only(["extension", "size", "mimeType", "name"]),
    directory,
    path: filePath,
  });
}
