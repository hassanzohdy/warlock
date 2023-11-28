import { fileExistsAsync, unlinkAsync } from "@mongez/fs";
import { Model } from "@mongez/monpulse";
import { areEqual } from "@mongez/reinforcements";
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

      if (areEqual(oldValue, newValue)) continue;

      if (Array.isArray(oldValue)) {
        Upload.aggregate()
          .whereIn(
            "hash",
            oldValue.map(value => value.hash),
          )
          .delete();
      } else {
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
