import config from "@mongez/config";
import { requestContext } from "../../../http";
import { WatermarkOptions } from "./types";

export async function getWatermarkOptions() {
  const watermark = config.get("uploads.watermark");

  if (!watermark) return;

  const request = requestContext().request;

  return (await watermark(request)) as WatermarkOptions;
}
