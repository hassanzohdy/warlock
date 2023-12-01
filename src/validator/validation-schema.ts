import type { Rule } from "./rules/rule";

export type RuleType = string | Rule;

export class ValidationSchema {
  /**
   * constructor
   */
  public constructor(
    public readonly inputs: {
      [key: string]: RuleType[] | ValidationSchema;
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

    return this;
  }

  /**
   * Apply the given rules to all inputs
   */
  public rules(rules: RuleType[]) {
    for (const input in this.inputs) {
      const list = this.inputs[input];
      if (Array.isArray(list)) {
        this.inputs[input] = rules.concat(list);
      } else {
        list.rules(rules);
      }
    }

    return this;
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
