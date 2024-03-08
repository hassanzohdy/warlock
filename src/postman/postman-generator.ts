/* eslint-disable no-prototype-builtins */
import config from "@mongez/config";
import { putJsonFile } from "@mongez/fs";
import { GenericObject, capitalize, rtrim, trim } from "@mongez/reinforcements";
import { isEmpty } from "@mongez/supportive-is";
import { plural, singular } from "pluralize";
import { router } from "../router";
import { rootPath } from "../utils";
import { ArraySchema, ValidationSchema } from "../validator";
import { getRuleHandler, getValidationSchema } from "../validator/utils";
import { PostmanEvents } from "./postman-events";
import {
  PostmanInput,
  PostmanInternalRequestType,
  PostmanNode,
  PostmanOutput,
  PostmanRequest,
  PostmanVariable,
} from "./types";

export class Postman {
  /**
   * Base url for the postman
   */
  protected _baseUrl = "";

  /**
   * Postman info
   */
  protected _info = {
    name: "",
    schema:
      "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
  };

  /**
   * Variables list
   */
  protected _variables: GenericObject = {};

  /**
   * Postman tree
   * A  tree is a list of folders and sub folders, each folder/sub-folder has a list of requests but not necessarily
   */
  protected _tree: PostmanNode[] = [];

  /**
   * Set the base url
   */
  public setBaseUrl(baseUrl: string) {
    this._baseUrl = baseUrl;

    return this;
  }

  /**
   * Set the variables
   */
  public setVariables(variables: GenericObject) {
    this._variables = variables;

    return this;
  }

  /**
   * Set tree
   */
  public setTree(tree: PostmanNode[]) {
    this._tree = tree;

    return this;
  }

  /**
   * Generate the postman json
   */
  public toJson() {
    //
  }

  /**
   * folders list
   */
  protected folders: any[] = [];

  protected flatFolders: any[] = [];

  /**
   * Generate postman
   */
  public async generate() {
    const postmanCollection: any = {
      item: [],
      parent: "",
      id: "",
      name: "",
      namespace: "",
    };

    this.flatFolders.push(postmanCollection);

    for (const route of router.list()) {
      const { path, method, $prefixStack } = route;

      const parentFolders = $prefixStack.map((prefix, index) => {
        let parent = "";
        for (let i = 0; i < index; i++) {
          parent += `${$prefixStack[i]}`;
        }

        const namespace = parent + prefix;

        return {
          name: prepareSegment(prefix),
          namespace,
          id: prefix,
          item: [],
          parent,
          type: "folder",
        };
      });

      let inputs: PostmanInput[] = [];

      if (route.handler.validation?.rules) {
        const validationSchema = getValidationSchema(
          route.handler.validation?.rules,
        );

        inputs = parseValidationSchema(validationSchema);
      }

      const request: PostmanInternalRequestType = {
        method,
        header: [],
        url: {
          raw: `{{baseUrl}}${path}`,
          host: [`{{baseUrl}}${path}`],
        },
      };

      if (!isEmpty(inputs)) {
        if (method === "GET") {
          request.url.query = inputs;
        } else {
          const hasFileInput =
            inputs.find(input => input.type === "file") !== undefined;

          request.body = {
            mode: hasFileInput ? "formdata" : "raw",
          };

          if (hasFileInput) {
            request.body.formdata = inputs;
          } else {
            request.body.options = {
              raw: {
                language: "json",
              },
            };

            request.body.raw = JSON.stringify(
              this.inputsListToObject(
                inputs,
                // route.handler.validation?.rules
                //   ? getJsonValidationSchema(
                //       getValidationSchema(route.handler.validation?.rules),
                //     )
                //   : [],
              ),
              null,
              2,
            );
          }
        }
      }

      for (const folder of parentFolders) {
        // check if folder id equals to namespace
        // if so, then it is a parent folder
        if (!this.flatFolders.find(f => f.namespace === folder.namespace)) {
          this.flatFolders.push(folder);
        }

        const parentFolder = this.flatFolders.find(f => f.id === folder.parent);

        if (parentFolder) {
          // make sure first the folder is not in the parent list

          if (
            !parentFolder.item.find(
              (f: any) => f.namespace === folder.namespace,
            )
          ) {
            parentFolder.item.push(folder);
          }
        }
      }

      const currentFolder =
        parentFolders.length > 0
          ? this.flatFolders.find(
              f =>
                f.namespace ===
                parentFolders[parentFolders.length - 1].namespace,
            ) || postmanCollection
          : postmanCollection;

      // Add the request to the current folder
      const postmanRequest: PostmanRequest = {
        name:
          route.description ||
          route.handler.description ||
          namedMethodRoute(path, method),
        request,
      };
      if (route.middleware) {
        const middlewareThatsHasPostman = route.middleware.filter(
          middleware => middleware.postman !== undefined,
        );

        middlewareThatsHasPostman.forEach(middleware => {
          middleware?.postman?.onAddingRequest?.({
            ...postmanRequest,
            route,
          });

          if (middleware?.postman?.onCollectingVariables) {
            PostmanEvents.onCollectingVariables(
              middleware?.postman?.onCollectingVariables,
            );
          }
        });
      }

      currentFolder.item.push(postmanRequest);
    }

    const prepareFolders = (folders: any) => {
      return folders.map((item: any) => {
        if (item.type !== "folder") {
          return item;
        }

        return {
          name: item.name,
          item: prepareFolders(item.item),
        };
      });
    };

    const collectionName =
      config.get("postman.collectionName") || config.get("app.appName");

    const wrappedCollection: PostmanOutput = {
      info: {
        name: collectionName,
        description: config.get("postman.description", ""),
        schema:
          "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
      },
      item: prepareFolders(postmanCollection.item),
      variable: this.generateVariables(),
    };

    const logFolder = (folder: any) => {
      for (const item of folder.item) {
        if (item.type === "folder") {
          logFolder(item);
        }
      }
    };

    logFolder(postmanCollection);

    putJsonFile(rootPath("postman.json"), wrappedCollection, {
      spaces: 2,
    });
  }

  protected inputsListToObject(inputs: PostmanInput[]) {
    const obj: GenericObject = {};

    for (const input of inputs) {
      obj[input.key] =
        (input.value || input.type) +
        (input.description ? ": " + input.description : "");
    }

    return obj;
  }

  /**
   * Generate variables
   */
  protected generateVariables() {
    const variables: PostmanVariable[] = [];

    variables.push(
      this.newVariable("baseUrl", config.get("postman.baseUrl", this._baseUrl)),
    );

    const otherVariables = config.get("postman.variables", {});

    for (const variable in otherVariables) {
      const value = otherVariables[variable];

      variables.push(this.newVariable(variable, value));
    }

    PostmanEvents.trigger("collectingVariables", variables);

    return variables;
  }

  /**
  /**
   * Make a new variable
   */
  protected newVariable(
    key: string,
    value: string,
    type: "string" | "number" = "string",
  ) {
    return {
      id: key,
      key,
      value,
      type,
    };
  }
}

function prepareSegment(segment: string) {
  return capitalize(trim(segment, "/").replace(/\/|-/g, " "));
}

function removeId(path: string) {
  // remove :id from the end of the path

  return trim(path.replace(/:id$/, "")).replace(/\s+/g, " ");
}

export function renderGetMethodRoute(path: string) {
  if (path.includes(":")) {
    //  we need to get rid of the word that starts with that `:` first
    const segments = path
      .split("/")
      .filter(segment => !segment.startsWith(":"));

    const lastSegment = segments.pop() as string;

    return `Get ${capitalize(singular(lastSegment))}`;
  }

  const lastSegment = path.split("/").pop() as string;

  return `Get ${capitalize(plural(lastSegment))} list`;
}

export function namedMethodRoute(path: string, method: string) {
  switch (method) {
    case "GET":
      return renderGetMethodRoute(path);
    case "POST":
      path = prepareSegment(path);
      return `Create New ${singular(path)}`;
    case "PUT":
      path = prepareSegment(path);
      return `Update ${singular(removeId(path))}`;
    case "DELETE":
      path = prepareSegment(path);
      if (path.includes(":")) {
        return `Delete ${singular(removeId(path))}`;
      }

      return `Delete ${plural(removeId(path))} list`;
    case "PATCH":
      path = prepareSegment(path);
      return `Patch ${singular(removeId(path))}`;

    default:
      return path;
  }
}

export function getJsonValidationSchema(schema: ValidationSchema) {
  const inputs = schema.inputs;

  const finalInputs: PostmanInput[] = [];

  for (const input in inputs) {
    const inputRules = inputs[input];

    if (inputRules instanceof ArraySchema) {
      finalInputs.push(...parseValidationSchema(inputRules, input + ".$"));
    } else if (inputRules instanceof ValidationSchema) {
      finalInputs.push(...parseValidationSchema(inputRules, input));
    } else {
      const data: Partial<PostmanInput> = {
        key: input,
        type: "text",
      };

      // now we need to generate the description from the rules
      let description = "";
      let isLocalized = false;

      for (const rule of inputRules) {
        const ruleHandler = getRuleHandler(rule);
        const expectedType = ruleHandler.expectedType();

        if (expectedType) {
          data.type = getProperType(expectedType);
        }

        ruleHandler.setInput(input);

        if (ruleHandler.getName() === "localized") {
          isLocalized = true;
        } else {
          description += `${ruleHandler.toJson()} | `;
        }
      }

      description = rtrim(description, " | ");

      if (isLocalized) {
        finalInputs.push({
          key: input,
          description,
          value: [
            {
              value: "",
              localeCode: "",
            },
          ],
        } as PostmanInput);
      } else {
        data.description = description;

        finalInputs.push(data as PostmanInput);
      }
    }
  }

  return finalInputs;
}

export function parseValidationSchema(
  schema: ValidationSchema,
  baseInputName = "",
) {
  const inputs = schema.inputs;

  const finalInputs: PostmanInput[] = [];

  for (const input in inputs) {
    const inputRules = inputs[input];

    if (inputRules instanceof ArraySchema) {
      finalInputs.push(...parseValidationSchema(inputRules, input + ".$"));
    } else if (inputRules instanceof ValidationSchema) {
      finalInputs.push(...parseValidationSchema(inputRules, input));
    } else {
      const data: Partial<PostmanInput> = {
        key: baseInputName ? baseInputName + "." + input : input,
        type: "text",
      };
      // now we need to generate the description from the rules
      let description = "";
      let isLocalized = false;

      for (const rule of inputRules) {
        const ruleHandler = getRuleHandler(rule);
        const expectedType = ruleHandler.expectedType();

        if (expectedType) {
          data.type = getProperType(expectedType);
        }

        ruleHandler.setInput(input);

        if (ruleHandler.getName() === "localized") {
          isLocalized = true;
        } else {
          description += `${ruleHandler.toJson()} | `;
        }
      }

      description = rtrim(description, " | ");

      if (isLocalized) {
        const valueInputKey = data.key + ".$.value";
        const localeCodeInputKey = data.key + ".$.localeCode";
        const locales = config.get("app.localeCodes");
        finalInputs.push({
          ...data,
          description,
          key: valueInputKey,
        } as PostmanInput);
        finalInputs.push({
          ...data,
          description:
            (description ? description + " | " : "") +
            "One Of: '" +
            locales.join("', '") +
            "'",
          key: localeCodeInputKey,
        } as PostmanInput);
      } else {
        data.description = description;

        finalInputs.push(data as PostmanInput);
      }
    }
  }

  return finalInputs;
}

function getProperType(type: string) {
  switch (type) {
    case "int":
    case "integer":
    case "float":
    case "number":
      return "number";
    case "bool":
    case "boolean":
      return "boolean";
    case "file":
      return "file";
    default:
      return "text";
  }
}
