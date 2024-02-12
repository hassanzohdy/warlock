/**
 * The purpose of this middleware is to create a separate context for each request
 * So classes and functions can access only current request and response in the context
 */

// use async_hooks to create a new context for each request
import { trans } from "@mongez/localization";
import { AsyncLocalStorage } from "async_hooks";
import { Auth } from "../../auth";
import { Request } from "../request";
import { Response } from "../response";

export type Context<User extends Auth = Auth> = {
  request: Request<User>;
  response: Response;
  user: User;
};

// create a new instance of AsyncLocalStorage

const asyncLocalStorage = new AsyncLocalStorage<Context>();

export function createRequestContext(
  request: Request<Auth>,
  response: Response,
) {
  // store the request and response in the context
  return new Promise((resolve, reject) => {
    asyncLocalStorage.run(
      {
        request,
        response,
        get user() {
          return request.user;
        },
      },
      async () => {
        //
        try {
          const result = await request.runMiddleware();

          if (result) {
            return resolve(result);
          }

          request.trigger("executingAction", request.route);

          const handler = request.getHandler();

          await handler(request, response);

          // call executedAction event
          request.trigger("executedAction", request.route);
        } catch (error: any) {
          reject(error);
          return response.badRequest({
            error: error.message,
          });
        }
      },
    );
  });
}

export function requestContext<UserType extends Auth = Auth>() {
  // get the context from the current execution
  return (asyncLocalStorage.getStore() || {}) as Context<UserType>;
}

export function t(keyword: string, placeholders?: any) {
  const { request } = requestContext();

  return request?.trans(keyword, placeholders) || trans(keyword);
}

/**
 * Get the value of the given key from the request
 * If not found, then execute the given callback and store its result in the request then return it
 */
export async function fromRequest<T = any>(
  key: string,
  callback: (request: Request) => Promise<any>,
): Promise<T> {
  const request = requestContext().request;

  if (!request) return callback(request);

  if (request[key]) return request[key];

  request[key] = await callback(request);

  return request[key];
}
