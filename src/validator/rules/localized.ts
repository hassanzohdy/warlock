import { Rule } from "./rule";

export class LocalizedRule extends Rule {
  /**
   * Rule name
   */
  public static ruleName = "localized";

  /**
   * Set error type based on current situation
   */
  protected errorType = {
    type: "",
    placeholders: {},
  };

  /**
   * Validate the rule
   */
  public async validate() {
    if (!Array.isArray(this.value)) {
      return this.markError("array");
    }

    for (const [index, value] of this.value.entries()) {
      console.log(value);

      if (typeof value !== "object") {
        return this.markError("object", {
          input: `${this.input}.${index}`,
        });
      }

      if (!value.localeCode) {
        return this.markError("required", {
          input: `${this.input}.${index}.localeCode`,
        });
      }

      if (!value.value) {
        return this.markError("required", {
          input: `${this.input}.${index}.value`,
        });
      }
    }
  }

  /**
   * Set the error type
   */
  protected markError(type: string, placeholders?: any) {
    this.errorType = {
      type,
      placeholders,
    };
    this.isValid = false;
  }

  /**
   * Get error message
   */
  public error() {
    return this.trans(this.errorType.type, this.errorType.placeholders);
  }
}
