import { t } from "../../http/middleware/inject-request-context";
import { Rule } from "./rule";

export class PatternRule extends Rule {
  /**
   * Rule name
   */
  public static ruleName = "pattern";

  /**
   * Constructor
   */
  public constructor(
    public pattern: RegExp,
    protected patternTranslationKey = pattern.toString(),
  ) {
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
      pattern: t(this.patternTranslationKey),
    });
  }
}
