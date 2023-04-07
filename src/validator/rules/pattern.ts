import Rule from "./rule";

export default class PatternRule extends Rule {
  /**
   * Rule name
   */
  public static ruleName = "pattern";

  /**
   * Constructor
   */
  public constructor(public pattern: RegExp) {
    super();
  }

  /**
   * Validate the rule
   */
  public async validate() {
    this.isValid = this.pattern.test(this.value);
  }

  /**
   * Get error message
   */
  public error() {
    return this.trans("pattern", {
      pattern: this.pattern.toString(),
    });
  }
}
