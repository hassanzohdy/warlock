// Example Of Usage

/**

import { router } from "@mongez/warlock";
import { adminPath, guarded } from "app/utils/router";
import deleteFile from "./controllers/deleteFile";
import getUploadedFile from "./controllers/getUploadedFile";
import uploadFiles from "./controllers/uploadFiles";

guarded(() => {
  router.delete(["/uploads/:hash", adminPath("/uploads/:hash")], deleteFile);
  router.post(["/uploads", adminPath("/uploads")], uploadFiles);
});

router.get("/uploads/*", getUploadedFile);

 */
