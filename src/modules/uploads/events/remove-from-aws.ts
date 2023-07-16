import { Upload } from "../models";
import { deleteFromAWS, getAWSConfigurations } from "./../../../aws";

export async function removeFromAWSBucket(file: Upload) {
  if (!file.get("isRemote")) return;

  // delete from AWS
  const awsOptions = await getAWSConfigurations();

  if (awsOptions) {
    try {
      await deleteFromAWS({
        fileName: file.get("provider.fileName"),
        connectionOptions: awsOptions,
      });
    } catch (error) {
      console.log(error);
      throw new Error("Failed to delete the file");
    }
  }
}
