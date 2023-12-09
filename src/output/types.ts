import type { Model } from "@mongez/monpulse";
import type { GenericObject } from "@mongez/reinforcements";
import type { Output } from "./output";

/**
 * Built in casts
 */
export type OutputCastType =
  | "string"
  | "number"
  | "boolean"
  | "object"
  | "array"
  | "float"
  | "integer"
  | "int"
  | "double"
  | "date"
  | "birthDate"
  | "url"
  | "any"
  | "location"
  | "mixed"
  | "localized"
  | "uploadsUrl"
  | "publicUrl"
  | "assetsUrl";

export type OutputValue =
  | OutputCastType
  | typeof Output
  | ((value: any) => Promise<any> | any);

/**
 * Advanced output transformer
 */
export type OutputTransformer = {
  transformer: (value: any) => Promise<any> | any;
  settings?: any;
};

/**
 * final output
 */
export type FinalOutput = Record<
  string,
  OutputValue | [string, OutputValue] | OutputTransformer
>;

/**
 * Allowed output data resource
 */
export type OutputResource = GenericObject | typeof Model | typeof Output;
