import type { RouteShorthandOptions } from "fastify";
import type { Auth } from "../auth";
import type { Request, Response, ReturnedResponse } from "../http";

/**
 * Middleware method
 * Receives the request and response objects
 * And returns a response object or undefined if the request should continue
 */
export type Middleware = (
  request: Request,
  response: Response,
) => ReturnedResponse | undefined | void;

export type RouterGroupCallback = () => void;

/**
 * Resource standard methods
 */
export type ResourceMethod =
  | "list"
  | "get"
  | "create"
  | "update"
  | "delete"
  | "patch";

export type RestfulMiddleware = Record<string, [Middleware]>;

export type RouteHandlerValidation = {
  /**
   * Validation rules
   */
  rules?: Record<string, any>;
  /**
   * Validation custom message
   */
  validate?: Middleware;
};

/**
 * Route handler receives a request and a response
 * And returns a returning response type
 */
export type RouteHandler = {
  /**
   * Function Declaration
   */
  (request: Request, response: Response): ReturnedResponse | void;

  /**
   * Validation static object property which can be optional
   */
  validation?: RouteHandlerValidation;

  /**
   * Handler description
   * Will be used for generating documentation
   */
  description?: string;
};

export type RequestHandler<T extends Auth = any> = {
  /**
   * Function Declaration
   */
  (request: Request<T>, response: Response): ReturnedResponse | void;

  /**
   * Validation static object property which can be optional
   */
  validation?: RouteHandlerValidation;
};

export type RouteOptions = {
  /**
   * Route middleware
   */
  middleware?: Middleware[];
  /**
   * Route name
   */
  name?: string;
  /**
   * Route description
   * Could be used for generating documentation
   */
  description?: string;
  /**
   * Request server options
   */
  serverOptions?: RouteShorthandOptions;
  /**
   * Set route label
   * Will be used for generating documentation
   * If not set, then Warlock will try to generate a label from the route path
   */
  label?: string;
  /**
   * Whether it is part of restful routes
   */
  restful?: boolean;
};

export type RequestMethod =
  | "GET"
  | "POST"
  | "PUT"
  | "DELETE"
  | "PATCH"
  | "OPTIONS"
  | "HEAD";

/**
 * Route Object
 */
export type Route = RouteOptions & {
  /**
   * Route method
   */
  method: RequestMethod;
  /**
   * Route path
   */
  path: string;
  /**
   * Route handler Can be a function
   * And als can have a `validation` object as a static property of the handler
   */
  handler: RouteHandler;
  /**
   * Path prefix
   * Kindly note the prefix is auto added by the router and it should be added to the path itself
   * this will be used for generating the documentation
   */
  $prefix: string;
};
export type PartialPick<T, F extends keyof T> = Omit<T, F> &
  Partial<Pick<T, F>>;

/**
 * Grouped routes options
 */
export type GroupedRoutesOptions = {
  /**
   * Middlewares to be applied to all routes
   */
  middleware?: Middleware[];
  /**
   * Route prefix
   */
  prefix?: string;
  /**
   * Route name
   * This will be added to each route as a name prefix
   */
  name?: string;
};

/** Route resource */
export type RouteResource = {
  /**
   * list route
   */
  list?: RouteHandler;
  /**
   * Single resource route
   */
  get?: RouteHandler;
  /**
   * Create resource route
   */
  create?: RouteHandler;
  /**
   * Update resource route
   */
  update?: RouteHandler;
  /**
   * Patch resource route
   */
  patch?: RouteHandler;
  /**
   * Delete resource route
   */
  delete?: RouteHandler;
  /**
   * Delete Multiple Records
   */
  bulkDelete?: RouteHandler;
  /**
   * Validation object
   */
  validation?: {
    /**
     * Apply validation on create|update|patch combined
     */
    all?: RouteHandlerValidation;
    /**
     * Create validation object
     */
    create?: RouteHandlerValidation;
    /**
     * Update validation object
     */
    update?: RouteHandlerValidation;
    /**
     * Patch validation object
     */
    patch?: RouteHandlerValidation;
  };
};

export type RouterStacks = {
  prefix: string[];
  name: string[];
  middleware: Middleware[];
};
