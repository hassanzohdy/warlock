import config from "@mongez/config";
import { log } from "@mongez/logger";
import { Request, Response } from "../http";
import { Route } from "../router";
import { ValidationSchema } from "./validation-schema";
import { Validator } from "./validator";

/**
 * Validate the request route
 */
export async function validateAll(
  validation: Route["handler"]["validation"],
  request: Request,
  response: Response,
) {
  if (!validation) return;

  log.info("request", "validation", "Start validating the request");

  if (validation.rules) {
    try {
      const rules =
        validation.rules instanceof ValidationSchema
          ? validation.rules
          : new ValidationSchema(validation.rules, false);
      const validator = await request.validate(rules);

      if (validator.fails()) {
        return response.validationFailed(validator);
      }
    } catch (error) {
      log.error("request", "validation", "Validation error", error);
      throw error;
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

      log.info("request", "validation", "Validation failed");

      return result;
    }

    log.info("request", "validation", "Validation passed");

    Validator.trigger("customPasses");
  }
}
