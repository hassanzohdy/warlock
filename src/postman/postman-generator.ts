import config from "@mongez/config";
import { putJsonFile } from "@mongez/fs";
import {
  GenericObject,
  capitalize,
  ltrim,
  rtrim,
  trim,
} from "@mongez/reinforcements";
import { isEmpty } from "@mongez/supportive-is";
import { plural, singular } from "pluralize";
import { router } from "../router";
import { rootPath } from "../utils";
import { ArraySchema, ValidationSchema } from "../validator";
import { getRuleHandler, getValidationSchema } from "../validator/utils";

export type PostmanNode = PostmanCategoryType | PostmanRequestType;

export type PostmanCategoryType = {
  name: string;
  description?: string;
  item: PostmanNode[];
};

interface PostmanFolder {
  name: string;
  item: (PostmanFolder | PostmanRequestType)[];
}

interface PostmanOutput {
  info: GenericObject;
  item: (PostmanFolder | PostmanRequestType)[];
}

export type MethodType =
  | "GET"
  | "POST"
  | "PUT"
  | "DELETE"
  | "PATCH"
  | "OPTIONS"
  | "HEAD";

export type PostmanBodyType = {
  mode: "urlencoded" | "raw" | "formdata" | "file";
  raw: string;
  options?: GenericObject;
};

export type PostmanQueryType = {
  key: string;
  value: string;
};

export type PostmanRequestUrl = {
  raw: string;
  host?: string[];
  protocol?: string;
  path?: string[];
  variable?: PostmanInput[];
};

export type PostmanInternalRequestType = {
  method: MethodType;
  header?: GenericObject[];
  body?: GenericObject;
  url: PostmanRequestUrl;
};

export type PostmanRequestType = {
  name: string;
  // path: string;
  request: PostmanInternalRequestType;
  response?: GenericObject[];

  // description?: string;
  // method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH" | "OPTIONS" | "HEAD";
  // headers?: GenericObject;
  // body?: GenericObject;
  // query?: GenericObject;
  // response?: GenericObject;
};

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
   * Generate postman
   */
  public async generate() {
    const postmanCollection = {
      item: [],
      name: "main",
    };

    for (const route of router.list()) {
      const { path, method } = route;

      const sanitizedPath = ltrim(path, "/").replaceAll("/", ".");

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
          raw: `${this._baseUrl}${path}`,
          protocol: "https",
          host: [this._baseUrl],
          path: path.split("/").slice(1),
        },
      };

      if (!isEmpty(inputs)) {
        if (method === "GET") {
          request.url.variable = inputs;
        } else {
          const hasFileInput =
            inputs.find(input => input.type === "file") !== undefined;
          request.body = {
            mode: hasFileInput ? "formdata" : "raw",
          };

          if (hasFileInput) {
            request.body.formdata = inputs;
          } else {
            request.body.raw = JSON.stringify(
              inputs.map(input => {
                return {
                  [input.key]:
                    input.value || input.type + ": " + input.description,
                };
              }),
              null,
              2,
            );
          }
        }
      }

      // Find or create the folder based on the sanitizedPath
      let currentFolder: PostmanFolder = postmanCollection as any;
      const pathSegments = sanitizedPath.split(".");
      for (let i = 0; i < pathSegments.length; i++) {
        const segment = pathSegments[i];

        // If the segment is "admin" and there is a next segment, combine them
        if (this.shouldWrapWithAdmin(segment) && i < pathSegments.length - 1) {
          const nextSegment = pathSegments[i + 1];
          const adminFolderName = `${segment}-${nextSegment}`;

          let adminFolder = (currentFolder.item as PostmanFolder[]).find(
            item => item.name === adminFolderName,
          );
          if (!adminFolder) {
            adminFolder = {
              name: prepareSegment(adminFolderName),
              item: [],
            };
            (currentFolder.item as PostmanFolder[]).push(adminFolder);
          }
          currentFolder = adminFolder;
          i++; // Skip the next segment, as it has been combined with "admin"
        } else {
          let folder = (currentFolder.item as PostmanFolder[]).find(
            item => item.name === segment,
          );

          if (!folder) {
            folder = {
              name: prepareSegment(segment),
              item: [],
            };

            (currentFolder.item as PostmanFolder[]).push(folder);
          }
          currentFolder = folder;
        }
      }

      currentFolder.item = flattenFolders(currentFolder);

      // Add the request to the current folder
      currentFolder.item.push({
        name:
          route.label ||
          namedMethodRoute(
            prepareSegment(route.$prefix ? ltrim(path, route.$prefix) : path),
            method,
          ),
        request,
        response: [],
      });
    }

    const wrappedCollection = this.wrapFolders(
      postmanCollection as PostmanFolder,
    );

    // Now, postmanCollection contains the structured data in the desired format
    // console.log(JSON.stringify(postmanCollection, null, 2));

    putJsonFile(rootPath("postman1.json"), postmanCollection);
    putJsonFile(rootPath("postman2.json"), wrappedCollection);
  }

  /**
   * Check if the segment should be wrapped with "admin"
   */
  private shouldWrapWithAdmin(folderName: string): boolean {
    return folderName.startsWith("admin");
  }

  /**
   * Wrap folders
   */

  private wrapFolders(folder: PostmanFolder): PostmanOutput {
    const wrappedFolderAdmin: PostmanFolder = {
      name: "admin",
      item: [],
    };

    const wrappedFolderOther: PostmanFolder = {
      name: "other",
      item: [],
    };

    // Separate folders starting with "admin" from the rest
    const adminFolders: PostmanFolder[] = [];
    const otherFolders: PostmanFolder[] = [];

    for (const item of folder.item) {
      if (item.name.startsWith("admin-")) {
        // remove the "admin-" prefix
        item.name = prepareSegment(item.name.replace("admin-", ""));
        adminFolders.push(item as PostmanFolder);
      } else {
        otherFolders.push(item as PostmanFolder);
      }
    }

    // Add the "admin" folder to the wrapped folder
    wrappedFolderAdmin.item.push(...adminFolders);
    wrappedFolderOther.item.push(...otherFolders);

    const topLevelCollection: PostmanOutput = {
      info: {
        name: "New Collection",
        schema:
          "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
      },
      item: [wrappedFolderAdmin, ...wrappedFolderOther.item],
    };

    return topLevelCollection;
  }
}

function prepareSegment(segment: string) {
  return capitalize(trim(segment, "/").replace(/\/|-/g, " "));
}

function removeId(path: string) {
  // remove :id from the end of the path

  return trim(path.replace(/:id$/, ""));
}

function checkHaveId(path: string) {
  return path.endsWith(":id");
}

export function renderGetMethodRoute(path: string) {
  if (path.endsWith(":id")) {
    return `Get ${singular(prepareSegment(removeId(path)))} by id`;
  }

  const lastSegment = path.split("/").pop() as string;

  return `Get ${capitalize(plural(lastSegment))} list`;
}

export function namedMethodRoute(path: string, method: string) {
  switch (method) {
    case "GET":
      return renderGetMethodRoute(path);
    case "POST":
      return `Create new ${singular(path)}`;
    case "PUT":
      return `Update ${singular(removeId(path))}`;
    case "DELETE":
      return checkHaveId(path)
        ? `Delete ${singular(removeId(path))} by id`
        : `Delete ${singular(removeId(path))}s`;
    case "PATCH":
      return `Patch ${singular(removeId(path))}`;

    default:
      return path;
  }
}

type PostmanInput = {
  key: string;
  type: "text" | "file" | "number" | "boolean" | "array" | "object";
  description?: string;
  value?: any;
};

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

function flattenFolders(folder: PostmanFolder): PostmanFolder[] {
  let flattenedItems: PostmanFolder[] = [];

  for (const item of folder.item) {
    if (Object.prototype.hasOwnProperty.call(item, "request")) {
      // It's a request, add it to the flattened list
      flattenedItems.push(item as PostmanFolder);
    } else if (Object.prototype.hasOwnProperty.call(item, "item")) {
      const nestedFolder = item as PostmanFolder;
      const flattenedNestedItems = flattenFolders(nestedFolder);

      if (flattenedNestedItems.length === 0) {
        // Include only folders with empty items
        flattenedItems.push({ ...nestedFolder, item: [] });
      } else {
        flattenedItems = flattenedItems.concat(flattenedNestedItems);
      }
    }
  }
  return flattenedItems;
}
