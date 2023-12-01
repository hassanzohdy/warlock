import type { Rule } from "./rules/rule";

export class ValidationSchema {
  /**
   * constructor
   */
  public constructor(
    public readonly inputs: {
      [key: string]: (string | Rule)[] | ValidationSchema;
    },
    public readonly isArraySchema = false,
  ) {
    //
  }

  /**
   * Mark all inputs as required
   */
  public requiredInputs() {
    for (const input in this.inputs) {
      const rules = this.inputs[input];

      if (Array.isArray(rules)) {
        if (!rules.includes("required")) {
          rules.unshift("required");
        }
      }
    }
  }
}

export class ArraySchema extends ValidationSchema {
  /**
   * constructor
   */
  public constructor(
    public readonly inputs: {
      [key: string]: (string | Rule)[] | ValidationSchema;
    },
  ) {
    super(inputs, true);
  }
}
