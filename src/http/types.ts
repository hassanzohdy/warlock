import { Middleware } from "../router";
import { Response } from "./response";

export type RequestEvent =
  | "executingMiddleware"
  | "executedMiddleware"
  | "executingAction"
  | "executedAction";

/**
 * Allowed response type
 */
export type ReturnedResponse =
  /**
   * Can be a response object
   */
  | Response
  /**
   * Or a promise returning a response object
   */
  | Promise<Response>
  /**
   * Or an object
   */
  | Record<string, any>
  /**
   * Or a promise returning an object
   */
  | Promise<Record<string, any>>
  /**
   * Or an array
   */
  | any[]
  /**
   * Or a promise returning an array
   */
  | Promise<any[]>;

/**
 * Response Event Types
 */
export type ResponseEvent =
  /**
   * Triggered before sending the response
   */
  | "sending"
  /**
   * Triggered after sending the response regardless of the response status code
   */
  | "sent"
  /**
   * Triggered after sending the response if the response status code is 2xx
   */
  | "success"
  /**
   * Triggered after sending the response if the response status code is 201
   */
  | "successCreate"
  /**
   * Triggered after sending the response if the response status code is 400
   */
  | "badRequest"
  /**
   * Triggered after sending the response if the response status code is 401
   */
  | "unauthorized"
  /**
   * Triggered after sending the response if the response status code is 403
   */
  | "forbidden"
  /**
   * Triggered after sending the response if the response status code is 404
   */
  | "notFound"
  /**
   * Triggered after sending the response if the response status code is 429
   */
  | "throttled"
  /**
   * Triggered after sending the response if the response status code is 500
   */
  | "serverError"
  /**
   * Triggered after sending the response if the response status code is 4xx or 5xx
   */
  | "error";

/**
 * Partial Middleware
 */
export interface PartialMiddleware {
  /**
   * Routes list
   * @example routes: ["/users", "/posts"]
   */
  routes?: string[];
  /**
   * Named routes list
   *
   * @example namedRoutes: ["users.list", "posts.list"]
   */
  namedRoutes?: string[];
  /**
   * Middlewares list
   */
  middleware: Middleware[];
}

/**
 * Http Configurations list
 */
export interface HttpConfigurations {
  /**
   * Server port
   */
  port?: number;
  /**
   * Log requests
   */
  log?: boolean;
  /**
   * Rate limit
   *
   */
  rateLimit?: {
    /**
     * max number of connections during windowMs milliseconds before sending a 429 response
     *
     * @default 60
     */
    max?: number;
    /**
     * how long to keep records of requests in memory
     *
     * @default 60 * 1000
     */
    duration?: number;
  };
  /**
   * Host
   */
  host?: string;
  /**
   * Http middlewares list
   */
  middleware?: {
    /**
     * All middlewares that are passed to `all` array will be applied to all routes
     */
    all?: Middleware[];
    /**
     * Middlewares that are passed to `only` object will be applied to specific routes
     */
    only?: PartialMiddleware;
    /**
     * Middlewares that are passed to `except` object will be excluded from specific routes
     */
    except?: PartialMiddleware;
  };
}
