import { Upload } from "../models";

export async function getUploadsSize(filter: any) {
  return Upload.aggregate().where(filter).sum("size");
}
