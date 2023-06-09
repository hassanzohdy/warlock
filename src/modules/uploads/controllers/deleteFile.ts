import { Upload } from "../models";
import { Request, Response } from "./../../../http";

export async function deleteFile(request: Request, response: Response) {
  //
  const file = await Upload.findBy("hash", request.input("hash"));

  if (!file) {
    return response.notFound();
  }

  file.destroy();

  return response.success();
}
