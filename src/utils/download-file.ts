import Endpoint from "@mongez/http";
import { AxiosResponse } from "axios";
import crypto from "crypto";
import { createWriteStream } from "fs";

export async function downloadFileFromUrl(
  fileUrl: string,
  outputLocationPath: string,
  fileName?: string,
): Promise<AxiosResponse> {
  const fileExtension = (fileName || fileUrl).split(".").pop();
  fileName ??= crypto.randomBytes(16).toString("hex");
  const writer = createWriteStream(
    outputLocationPath + "/" + fileName + "." + fileExtension,
  );

  const request = new Endpoint({ baseURL: "" });

  return request
    .get(fileUrl, {
      responseType: "stream",
    })
    .then(response => {
      //ensure that the user can call `then()` only when the file has
      //been downloaded entirely.

      return new Promise((resolve, reject) => {
        response.data.pipe(writer);
        let error: any = null;
        writer.on("error", err => {
          error = err;
          writer.close();
          reject(err);
        });
        writer.on("close", () => {
          if (!error) {
            resolve(response);
          }
          //no need to call the reject here, as it will be called in the
          //'error' stream;
        });
      });
    });
}
