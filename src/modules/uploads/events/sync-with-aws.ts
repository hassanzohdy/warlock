import { Upload } from "../models";
import { removeFromAWSBucket } from "./remove-from-aws";
import { uploadFileToAWS, uploadFileToAWSInBackground } from "./upload-to-aws";

export async function syncFilesWithAWS() {
  Upload.events()
    .onSaving(uploadFileToAWS)
    .onSaved(uploadFileToAWSInBackground)
    .onDeleted(removeFromAWSBucket);
}
