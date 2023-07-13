/* eslint-disable @typescript-eslint/no-non-null-assertion */
import concatRoute from "@mongez/concat-route";
import { log } from "@mongez/logger";
import {
  GenericObject,
  ltrim,
  merge,
  toCamelCase,
  trim,
} from "@mongez/reinforcements";
import Is from "@mongez/supportive-is";
import { Request } from "../http/request";
import { Response } from "../http/response";
import {
  GroupedRoutesOptions,
  ResourceMethod,
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
    path: string | string[],
    handler: RouteHandler | [GenericObject, string],
    options: RouteOptions = {},
  ) {
    if (Array.isArray(path)) {
      path.forEach(p => this.add(method, p, handler, options));
      return this;
    }

    if (Array.isArray(handler)) {
      const [controller, action] = handler;

      if (typeof controller[action] !== "function") {
        throw new Error(
          `Invalid controller action "${action}" for controller "${controller.constructor.name}"`,
        );
      }

      handler = controller[action].bind(controller) as RouteHandler;

      if (!handler.validation) {
        handler.validation = {};
        if (controller[`${action}ValidationRules`]) {
          handler.validation.rules = controller[`${action}ValidationRules`]();
        }

        if (controller[`${action}Validate`]) {
          handler.validation.validate = controller[`${action}Validate`];
        }
      }
    }

    const routeData: Route = {
      method,
      path,
      handler,
      ...options,
    };

    if (routeData.name) {
      // check if the name exists
      const route = this.routes.find(route => route.name === routeData.name);

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
  public get(
    path: string,
    handler: RouteHandler | [GenericObject, string],
    options: RouteOptions = {},
  ) {
    return this.add("GET", path, handler, options);
  }

  /**
   * Add post request method
   */
  public post(
    path: string | string[],
    handler: RouteHandler | [GenericObject, string],
    options: RouteOptions = {},
  ) {
    return this.add("POST", path, handler, options);
  }

  /**
   * Add put request method
   */
  public put(
    path: string,
    handler: RouteHandler | [GenericObject, string],
    options: RouteOptions = {},
  ) {
    return this.add("PUT", path, handler, options);
  }

  /**
   * Add delete request method
   */
  public delete(
    path: string | string[],
    handler: RouteHandler | [GenericObject, string],
    options: RouteOptions = {},
  ) {
    return this.add("DELETE", path, handler, options);
  }

  /**
   * Add patch request method
   */
  public patch(
    path: string,
    handler: RouteHandler | [GenericObject, string],
    options: RouteOptions = {},
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
    options: RouteOptions & {
      only?: ResourceMethod[];
      except?: ResourceMethod[];
      replace?: Partial<Record<ResourceMethod, RouteHandler>> & {
        bulkDelete?: RouteHandler;
      };
    } = {},
  ) {
    // get base resource name
    const baseResourceName = options.name || toCamelCase(ltrim(path, "/"));

    // clone the resource so we don't mess up with it
    const routeResource = resource;

    const isAcceptableResource = (type: ResourceMethod) => {
      return Boolean(
        // check if the route is not excluded
        (!options.except || !options.except.includes(type)) &&
          // check if the only option is set and the route is included
          (!options.only || options.only.includes(type)),
      );
    };

    if (routeResource.list && isAcceptableResource("list")) {
      const resourceName = baseResourceName + ".list";
      this.get(
        path,
        options.replace?.list || routeResource.list.bind(routeResource),
        {
          ...options,
          name: resourceName,
        },
      );
    }

    if (routeResource.get && isAcceptableResource("get")) {
      const resourceName = baseResourceName + ".get";

      this.get(
        path + "/:id",
        options.replace?.get || routeResource.get.bind(routeResource),
        {
          ...options,
          name: resourceName,
        },
      );
    }

    if (routeResource.create && isAcceptableResource("create")) {
      const resourceName = baseResourceName + ".create";

      this.manageValidation(routeResource, "create");

      this.post(
        path,
        options.replace?.create || routeResource.create.bind(routeResource),
        {
          ...options,
          name: resourceName,
        },
      );
    }

    if (routeResource.update && isAcceptableResource("update")) {
      const resourceName = baseResourceName + ".update";

      this.manageValidation(routeResource, "update");

      this.put(
        path + "/:id",
        options.replace?.update || routeResource.update.bind(routeResource),
        {
          ...options,
          name: resourceName,
        },
      );
    }

    if (routeResource.patch && isAcceptableResource("patch")) {
      const resourceName = baseResourceName + ".patch";

      this.manageValidation(routeResource, "patch");

      this.patch(
        path + "/:id",
        options.replace?.patch || routeResource.patch.bind(routeResource),
        {
          ...options,
          name: resourceName,
        },
      );
    }

    if (routeResource.delete && isAcceptableResource("delete")) {
      const resourceName = baseResourceName + ".delete";

      this.delete(
        path + "/:id",
        options.replace?.delete || routeResource.delete.bind(routeResource),
        {
          ...options,
          name: resourceName,
        },
      );
    }

    if (routeResource.bulkDelete && isAcceptableResource("delete")) {
      const resourceName = baseResourceName + ".bulkDelete";

      this.delete(
        path,
        options.replace?.bulkDelete ||
          routeResource.bulkDelete.bind(routeResource),
        {
          ...options,
          name: resourceName,
        },
      );
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
      routes: Route[],
    ) => {
      routes.forEach(route => {
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
        route => !currentRoutes.includes(route),
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
    method: "create" | "update" | "patch",
  ) {
    const handler = resource[method]?.bind(resource);

    if (!handler) return;

    const methodValidation = resource?.validation?.[method];

    if (!resource.validation || (!methodValidation && !resource.validation.all))
      return;

    if (resource.validation.all) {
      const validationMethods = {
        all: resource?.validation?.all?.validate,
        [method]: methodValidation?.validate,
      };

      const validation: RouteHandlerValidation = {};

      if (resource.validation.all.rules || methodValidation?.rules) {
        validation.rules = merge(
          resource.validation.all.rules,
          methodValidation?.rules,
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

          return;
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
    this.routes.forEach(route => {
      const requestMethod = route.method.toLowerCase(); /// post
      const requestMethodFunction = server[requestMethod].bind(server);

      route.path.includes("/uploads") && console.log(route.serverOptions);

      requestMethodFunction(
        route.path,
        {
          ...(route.serverOptions || {}),
        },
        this.handleRoute(route),
      );
    });
  }

  /**
   * Handle the given route
   */
  private handleRoute(route: Route) {
    return async (fastifyRequest: any, fastifyResponse: any) => {
      log.info(
        "route",
        route.method + " " + route.path.replace("/*", ""),
        "Starting Request",
      );

      const request = new Request();
      const response = new Response();

      response.setResponse(fastifyResponse);

      request.response = response;

      response.request = request;

      request.setRequest(fastifyRequest).setRoute(route);

      Request.current = request;

      const result = await request.execute();

      return result;
    };
  }
}

export const router = Router.getInstance();
