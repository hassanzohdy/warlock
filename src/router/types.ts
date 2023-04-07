import { Request, Response, ReturnedResponse } from "../http";

/**
 * Middleware method
 * Receives the request and response objects
 * And returns a response object or undefined if the request should continue
 */
export type Middleware = (
  request: Request,
  response: Response,
) => ReturnedResponse | undefined | void;

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
  (request: Request, response: Response): ReturnedResponse;

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
};

/**
 * Route Object
 */
export type Route = RouteOptions & {
  /**
   * Route method
   */
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  /**
   * Route path
   */
  path: string;
  /**
   * Route handler Can be a function
   * And als can have a `validation` object as a static property of the handler
   */
  handler: RouteHandler;
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
  /**
   * If set, all route methods will be set to this method
   */
  method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  /**
   * Routes list
   */
  routes?: PartialPick<Route, "method">[];
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
