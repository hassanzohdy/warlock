import concatRoute from "@mongez/concat-route";
import { ltrim, merge, toCamelCase, trim } from "@mongez/reinforcements";
import Is from "@mongez/supportive-is";
import { Request } from "../http/request";
import { Response } from "../http/response";
import {
  GroupedRoutesOptions,
  Route,
  RouteHandler,
  RouteHandlerValidation,
  RouteOptions,
  RouteResource,
} from "./types";

export class Router {
  /**
   * Routes list
   */
  private routes: Route[] = [];

  /**
   * Router Instance
   */
  private static instance: Router;

  /**
   * Get router instance
   */
  public static getInstance() {
    if (!Router.instance) {
      Router.instance = new Router();
    }

    return Router.instance;
  }

  private constructor() {
    //
  }

  /**
   * Add route to routes list
   */
  public add(
    method: Route["method"],
    path: string,
    handler: RouteHandler,
    options: RouteOptions = {}
  ) {
    const routeData: Route = {
      method,
      path,
      handler,
      ...options,
    };

    if (routeData.name) {
      // check if the name exists
      const route = this.routes.find((route) => route.name === routeData.name);

      if (route) {
        // check again if the route name exists with the same method
        if (route.method === routeData.method) {
          throw new Error(`Route name "${routeData.name}" already exists`);
        } else {
          routeData.name += `.${routeData.method.toLowerCase()}`;
        }
      }
    }

    this.routes.push(routeData);

    return this;
  }

  /**
   * Add get request method
   */
  public get(path: string, handler: RouteHandler, options: RouteOptions = {}) {
    return this.add("GET", path, handler, options);
  }

  /**
   * Add post request method
   */
  public post(path: string, handler: RouteHandler, options: RouteOptions = {}) {
    return this.add("POST", path, handler, options);
  }

  /**
   * Add put request method
   */
  public put(path: string, handler: RouteHandler, options: RouteOptions = {}) {
    return this.add("PUT", path, handler, options);
  }

  /**
   * Add delete request method
   */
  public delete(
    path: string,
    handler: RouteHandler,
    options: RouteOptions = {}
  ) {
    return this.add("DELETE", path, handler, options);
  }

  /**
   * Add patch request method
   */
  public patch(
    path: string,
    handler: RouteHandler,
    options: RouteOptions = {}
  ) {
    return this.add("PATCH", path, handler, options);
  }

  /**
   * Add full restful resource routes
   * This method will generate the following routes:
   * 1. GET /path: list all resources
   * 2. GET /path/:id: get a single resource
   * 3. POST /path: create a new resource
   * 4. PUT /path/:id: update a resource
   * 5. DELETE /path/:id: delete a resource
   * 6. PATCH /path/:id: update a resource partially
   */
  public restfulResource(
    path: string,
    resource: RouteResource,
    options: RouteOptions = {}
  ) {
    // get base resource name
    const baseResourceName = options.name || toCamelCase(ltrim(path, "/"));

    if (resource.list) {
      const resourceName = baseResourceName + ".list";
      this.get(path, resource.list.bind(resource), {
        ...options,
        name: resourceName,
      });
    }

    if (resource.get) {
      const resourceName = baseResourceName + ".get";

      this.get(path + "/:id", resource.get.bind(resource), {
        ...options,
        name: resourceName,
      });
    }

    if (resource.create) {
      const resourceName = baseResourceName + ".create";

      this.manageValidation(resource, "create");

      this.post(path, resource.create.bind(resource), {
        ...options,
        name: resourceName,
      });
    }

    if (resource.update) {
      const resourceName = baseResourceName + ".update";

      this.manageValidation(resource, "update");

      this.put(path + "/:id", resource.update.bind(resource), {
        ...options,
        name: resourceName,
      });
    }

    if (resource.patch) {
      const resourceName = baseResourceName + ".patch";

      this.manageValidation(resource, "patch");

      this.patch(path + "/:id", resource.patch.bind(resource), {
        ...options,
        name: resourceName,
      });
    }

    if (resource.delete) {
      const resourceName = baseResourceName + ".delete";

      this.delete(path + "/:id", resource.delete.bind(resource), {
        ...options,
        name: resourceName,
      });
    }

    return this;
  }

  /**
   * Group routes with options
   */
  public group(options: GroupedRoutesOptions, callback?: () => void) {
    const { prefix, name, method, middleware, routes } = options;

    const applyGroupOptionsOnRoutes = (
      // type is routes of grouped routes options but it has to be changed to be strict
      routes: Route[]
    ) => {
      routes.forEach((route) => {
        if (prefix) {
          route.path = concatRoute(prefix, route.path);
        }

        if (name) {
          route.name =
            name + "." + (route.name || route.path.replace(/\/|:/g, "."));
        }

        // replace multiple . with one .
        if (route.name) {
          route.name = route.name.replace(/\.{2,}/g, ".");
        } else {
          route.name = route.path.replace(/\/|:/g, ".");
        }

        if (route.name) {
          route.name = trim(route.name, ".");
        }

        if (method) {
          route.method = method;
        }

        if (!route.method) {
          route.method = "GET";
        }

        if (middleware) {
          route.middleware = route.middleware
            ? [...middleware, ...route.middleware]
            : middleware;
        }

        this.add(route.method, route.path, route.handler, route);
      });
    };

    if (routes) {
      applyGroupOptionsOnRoutes(routes as Route[]);
    }

    if (callback) {
      const currentRoutes = [...this.routes];
      callback();
      // get new routes
      const newRoutes = this.routes.filter(
        (route) => !currentRoutes.includes(route)
      );

      this.routes = [...currentRoutes];

      applyGroupOptionsOnRoutes(newRoutes);
    }

    return this;
  }

  /**
   * Add prefix to all routes in the given callback
   */
  public prefix(prefix: string, callback?: () => void) {
    return this.group({ prefix }, callback);
  }

  /**
   * Manage validation system for the given resource
   */
  private manageValidation(
    resource: RouteResource,
    method: "create" | "update" | "patch"
  ) {
    const handler = resource[method]?.bind(resource);

    if (!handler) return;

    const methodValidation = resource?.validation?.[method];

    if (!resource.validation || !methodValidation) return;

    if (resource.validation.all) {
      const validationMethods = {
        all: resource?.validation?.all?.validate,
        [method]: methodValidation.validate,
      };

      const validation: RouteHandlerValidation = {};

      if (resource.validation.all.rules || methodValidation.rules) {
        validation.rules = merge(
          resource.validation.all.rules,
          methodValidation.rules
        );
      }

      if (validationMethods.all || validationMethods[method]) {
        validation.validate = async (request: Request, response: Response) => {
          if (validationMethods.all) {
            const output = await validationMethods.all(request, response);

            if (output) return output;
          }

          if (validationMethods[method]) {
            return await validationMethods[method]?.(request, response);
          }

          return undefined;
        };
      }

      if (!Is.empty(validation)) {
        handler.validation = validation;
      }
    } else {
      handler.validation = resource.validation[method];
    }

    if (handler.validation?.validate) {
      handler.validation.validate = handler.validation.validate.bind(resource);
    }

    resource[method] = handler;
  }

  /**
   * Get all routes list
   */
  public list() {
    return this.routes;
  }

  /**
   * Register routes to the server
   */
  public scan(server: any) {
    this.routes.forEach((route) => {
      const requestMethod = route.method.toLowerCase();
      const requestMethodFunction = server[requestMethod].bind(server);

      requestMethodFunction(route.path, this.handleRoute(route));
    });
  }

  /**
   * Handle the given route
   */
  private handleRoute(route: Route) {
    return async (fastifyRequest: any, fastifyResponse: any) => {
      const request = new Request();
      const response = new Response();
      request.response = response;

      response.request = request;

      request
        .setRequest(fastifyRequest)
        .setResponse(fastifyResponse)
        .setRoute(route);

      Request.current = request;

      const result = await request.execute();

      return result;
    };
  }
}

export const router = Router.getInstance();
