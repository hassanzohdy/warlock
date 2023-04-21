/**
 * The purpose of this middleware is to create a separate context for each request
 * So classes and functions can access only current request and response in the context
 */

// use async_hooks to create a new context for each request
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
  handler: any,
) {
  // store the request and response in the context
  return new Promise((resolve, reject) => {
    asyncLocalStorage.run(
      { request, response, user: request.user },
      async () => {
        //
        try {
          resolve(await handler(request, response));
        } catch (error) {
          reject(error);
        }
      },
    );
  });
}

export function requestContext<UserType extends Auth = Auth>() {
  // get the context from the current execution
  return (asyncLocalStorage.getStore() || {}) as Context<UserType>;
}

export const requestCtx = requestContext;
