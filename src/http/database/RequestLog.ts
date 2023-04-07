import { Casts, Model } from "@mongez/mongodb";

export class RequestLog extends Model {
  /**
   * {@inheritdoc}
   */
  public static collection = "requestLogs";

  /**
   * {@inheritdoc}
   */
  protected casts: Casts = {
    statusCode: "integer",
    responseTime: "integer",
    responseSize: "integer",
    responseBody: "object",
    responseHeaders: "object",
    ip: "string",
    method: "string",
    route: "string",
    requestHeaders: "object",
    userAgent: "string",
    referer: "string",
    requestBody: "object",
    requestParams: "object",
    requestQuery: "object",
  };
}
