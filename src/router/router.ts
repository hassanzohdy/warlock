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
import { isEmpty } from "@mongez/supportive-is";
import { FastifyReply, FastifyRequest } from "fastify";
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
  RouterStacks,
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
   * Stacks
   * Stacks will be used for grouping routes to add prefix, name or middleware
   */
  protected stacks: RouterStacks = {
    prefix: [],
    name: [],
    middleware: [],
  };

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

    path = this.stacks.prefix.reduce((path, prefix) => {
      return concatRoute(prefix, path);
    }, path);

    // admin
    // users
    // list
    const name = this.stacks.name.reduceRight(
      (name, prefixName) => {
        // admin.list
        return trim(prefixName + "." + name, ".");
      },
      options.name || trim(path.replace(/\//g, "."), "."),
    );

    options.middleware = [
      ...(options.middleware || []),
      ...this.stacks.middleware,
    ];

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
      name,
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
   * Add a request that accepts all methods
   */
  public any(
    path: string,
    handler: RouteHandler | [GenericObject, string],
    options: RouteOptions = {},
  ) {
    return this.add("all" as Route["method"], path, handler, options);
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
   * Add head request method
   */
  public head(
    path: string,
    handler: RouteHandler | [GenericObject, string],
    options: RouteOptions = {},
  ) {
    return this.add("HEAD", path, handler, options);
  }

  /**
   * Add options request method
   */
  public options(
    path: string,
    handler: RouteHandler | [GenericObject, string],
    options: RouteOptions = {},
  ) {
    return this.add("OPTIONS", path, handler, options);
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
      const resourceName = baseResourceName + ".single";

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

      const handler =
        options.replace?.create ||
        this.manageValidation(routeResource, "create");

      this.post(path, handler, {
        ...options,
        name: resourceName,
      });
    }

    if (routeResource.update && isAcceptableResource("update")) {
      const resourceName = baseResourceName + ".update";

      const handler =
        options.replace?.update ||
        this.manageValidation(routeResource, "update");

      this.put(path + "/:id", handler, {
        ...options,
        name: resourceName,
      });
    }

    if (routeResource.patch && isAcceptableResource("patch")) {
      const resourceName = baseResourceName + ".patch";

      const handler =
        options.replace?.patch || this.manageValidation(routeResource, "patch");

      this.patch(path + "/:id", handler, {
        ...options,
        name: resourceName,
      });
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
  public group(options: GroupedRoutesOptions, callback: () => void) {
    const {
      prefix,
      // name must always be defined because
      // if there are multiple groups without name
      // they might generate the same route name
      // thus causing an error
      // in this case we need always to make sure that
      // the name is always defined.
      name = prefix ? trim(prefix.replace(/\//g, "."), ".") : undefined,
      middleware,
    } = options;

    if (prefix) {
      this.stacks.prefix.push(prefix);
    }

    if (name) {
      this.stacks.name.push(name);
    }

    if (middleware) {
      this.stacks.middleware.push(...middleware);
    }

    callback();

    if (prefix) {
      this.stacks.prefix.pop();
    }

    if (name) {
      this.stacks.name.pop();
    }

    if (middleware) {
      this.stacks.middleware.splice(
        this.stacks.middleware.length - middleware.length,
        middleware.length,
      );
    }

    return this;
  }

  /**
   * Add prefix to all routes in the given callback
   */
  public prefix(prefix: string, callback: () => void) {
    return this.group({ prefix }, callback);
  }

  /**
   * Manage validation system for the given resource
   */
  private manageValidation(
    resource: RouteResource,
    method: "create" | "update" | "patch",
  ) {
    const handler = resource[method]?.bind(resource) as RouteHandler;

    const methodValidation = resource?.validation?.[method];

    if (method === "patch" && methodValidation) {
      handler.validation = methodValidation;

      if (handler.validation?.validate) {
        handler.validation.validate =
          handler.validation.validate.bind(resource);
      }

      return handler;
    }

    if (!resource.validation || (!methodValidation && !resource.validation.all))
      return handler;

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
            const output = await validationMethods.all.call(
              resource,
              request,
              response,
            );

            if (output) return output;
          }

          if (validationMethods[method]) {
            return await validationMethods[method]?.call(
              resource,
              request,
              response,
            );
          }

          return;
        };
      }

      if (!isEmpty(validation)) {
        handler.validation = validation;
      }
    } else {
      handler.validation = resource.validation[method];

      if (handler.validation?.validate) {
        handler.validation.validate =
          handler.validation.validate.bind(resource);
      }
    }

    return handler;
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
      const requestMethod = route.method.toLowerCase();
      const requestMethodFunction = server[requestMethod].bind(server);

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
   * Get the route path for the given route name
   */
  public route(name: string, params: any = {}) {
    const route = this.routes.find(route => route.name === name);

    if (!route) {
      throw new Error(`Route name "${name}" not found`);
    }

    let path = route.path;

    if (route.path.includes(":")) {
      Object.keys(params).forEach(key => {
        path = path.replace(":" + key, params[key]);
      });
    }

    return path;
  }

  /**
   * Handle the given route
   */
  private handleRoute(route: Route) {
    return async (
      fastifyRequest: FastifyRequest,
      fastifyResponse: FastifyReply,
    ) => {
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
