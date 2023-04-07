import RequestLog from "./database/RequestLog";
import { Request } from "./request";
import { Response } from "./response";

export function logResponse(response: Response) {
  const request = Request.current;
  RequestLog.create({
    statusCode: response.statusCode,
    responseTime: response.getResponseTime(),
    responseSize: response.getHeader("Content-Length"),
    responseBody: response.body,
    responseHeaders: response.getHeaders(),
    ip: request.ip,
    method: request.currentRoute.method,
    route: request.currentRoute.path,
    requestHeaders: request.headers,
    userAgent: request.headers["user-agent"],
    referer: request.headers.referer,
    // requestBody: request.bodyInputs,
    requestParams: request.params,
    requestQuery: request.query,
  });
}

export function wrapResponseInDataKey(response: Response) {
  if (typeof response.body === "string") return;
  if (response.body) {
    response.body = { data: response.body };
  }
}
