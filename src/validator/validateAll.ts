import config from "@mongez/config";
import { log } from "@mongez/logger";
import { Request, Response } from "../http";
import { Route } from "../router";
import Validator from "./validator";

/**
 * Validate the request route
 */
export default async function validateAll(
  validation: Route["handler"]["validation"],
  request: Request,
  response: Response,
) {
  if (!validation) return;

  log.info("request", "validation", "Start validating the request");

  if (validation.rules) {
    const validator = await request.validate(validation.rules);

    if (validator.fails()) {
      return response.validationFailed(validator);
    }
  }

  if (validation.validate) {
    Validator.trigger("customValidating", validation.validate);
    const result = await validation.validate(request, response);

    Validator.trigger("customDone", result);

    // if there is a result, it means it failed
    if (result) {
      Validator.trigger("customFails", result);

      // check if there is no response status code, then set it to config value or 400 as default
      if (!response.statusCode) {
        response.setStatusCode(config.get("validation.responseStatus", 400));
      }

      log.error("request", "validation", "Validation failed");

      return result;
    }

    log.success("request", "validation", "Validation passed");

    Validator.trigger("customPasses");
  }
}
