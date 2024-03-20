import { GenericObject } from "@mongez/reinforcements";
import { readFileSync } from "fs";
import { Info, SwaggerStructure } from "./types";

class Postman2Swagger {
  /**
   * Target and main function
   */
  public async convert(inputPath: string, outputPath: string) {
    // postman content
    const postmanFileContent = this.cleanInput(inputPath);

    // Convert it into json
    const postmanFileContentJson = JSON.parse(postmanFileContent);

    // get item and variables
    const { info, item: items, variables } = postmanFileContentJson;

    // get swagger info
    const swaggerInfo: Info = this.getSwaggerInfo(info);

    const swaggerStructure: SwaggerStructure = {
      openapi: "3.0.0",
      info: swaggerInfo,
    };
  }

  /**
   * Prepare Swagger Paths
   */
  public prepareSwaggerPaths(items: GenericObject[]) {}

  /**
   * Get Swagger info
   */
  public getSwaggerInfo(info: GenericObject) {
    return {
      title: info.title,
      description: info.description,
      version: info?.version || "1.0.0",
    };
  }

  /**
   * Clean input
   */
  public cleanInput(input: string) {
    // check if input starts with {
    if (input.trim().startsWith("{")) {
      return input;
    } else {
      return readFileSync(input, "utf8");
    }
  }
}


