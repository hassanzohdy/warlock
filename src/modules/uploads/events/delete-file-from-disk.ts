import { fileExistsAsync, unlinkAsync } from "@mongez/fs";
import { Upload } from "../models";

Upload.events().onDeleted(async (upload: Upload) => {
  const path = upload.path;

  if (!(await fileExistsAsync(path))) return;

  unlinkAsync(path);
});
