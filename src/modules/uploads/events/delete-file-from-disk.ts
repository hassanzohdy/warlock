import { fileExistsAsync, unlinkAsync } from "@mongez/fs";
import { Model } from "@mongez/monpulse";
import { Upload } from "../models";

Upload.events().onDeleted(async (upload: Upload) => {
  const path = upload.path;

  if (!(await fileExistsAsync(path))) return;

  unlinkAsync(path);
});

Model.events()
  .onUpdated(async (model: Model, oldModel: Model) => {
    const uploads = oldModel.get("_uploads");

    if (!uploads) return;

    for (const column in uploads) {
      const oldValue = oldModel.get(column);
      const newValue = model.get(column);

      if (Array.isArray(oldValue) && Array.isArray(newValue)) {
        // now find all hashes on the old value that are not in the new value
        const hashes = oldValue
          .map(value => value.hash)
          .filter(hash => {
            return !newValue.find(value => value.hash === hash);
          });

        Upload.aggregate().whereIn("hash", hashes).delete();
      } else if (oldValue && newValue && oldValue.hash !== newValue.hash) {
        Upload.aggregate().where("hash", oldValue.hash).delete();
      }
    }
  })
  .onDeleted(async (model: Model) => {
    const uploads = model.get("_uploads");

    if (!uploads) return;

    for (const column in uploads) {
      const value = model.get(column);

      if (Array.isArray(value)) {
        Upload.aggregate()
          .whereIn(
            "hash",
            value.map(value => value.hash),
          )
          .delete();
      } else {
        Upload.aggregate().where("hash", value.hash).delete();
      }
    }
  });
