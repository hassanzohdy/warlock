import config from "@mongez/config";
import dayjs from "dayjs";

export async function getUploadsDirectory(directoryInput?: string) {
  if (directoryInput) return directoryInput;

  const configDirectory = config.get("uploads.saveTo");

  const path = dayjs().format("DD-MM-YYYY");

  if (configDirectory) {
    if (typeof configDirectory === "function") {
      return await configDirectory(path);
    }

    return configDirectory;
  }

  return path;
}
