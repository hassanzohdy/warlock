import { GenericObject } from "@mongez/reinforcements";

export interface postmanFileContent {
  info: GenericObject;
  item: GenericObject[];
  variables?: GenericObject[];
}

/**
 * Swagger info
 */
export type SwaggerStructure = {
  openapi: string;
  info: Info;
};

/**
 * Info
 */
export type Info = {
  title: string;
  description: string;
  version: string;
};
