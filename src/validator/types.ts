import Rule from "./rules/rule";

/**
 * Validation event types
 */
export type ValidationEvent =
  | "validating"
  | "passes"
  | "fails"
  | "done"
  | "customValidating"
  | "customPasses"
  | "customFails"
  | "customDone";

export type ValidationConfigurations = {
  /**
   * Whether to stop validator after first failed rule
   *
   * @default true
   */
  stopOnFirstFailure?: boolean;
  /**
   * Return Error Strategy
   * If strategy is `first` then it will return a single error in string from the rule errors list
   * If strategy is `all` then it will return an array of string that contains all errors.
   *
   * The `all` strategy will be affected as well with `stopOnFirstFailure` if it is set to `true`
   * and strategy is set to `all` it will always return an array with one value
   *
   * @default first
   */
  returnErrorStrategy?: "first" | "all";
  /**
   * Response status code
   *
   * @default 400
   */
  responseStatus?: number;
  /**
   * Validation keys
   */
  keys?: {
    /**
     * Response error key that will wrap the entire errors
     *
     * @default errors
     */
    response?: string;
    /**
     * Input key name
     *
     * @default input
     */
    inputKey?: string;
    /**
     * Single Error key (when strategy is set to first)
     *
     * @default error
     */
    inputError?: string;
    /**
     * Multiple Errors key (when strategy is set to all)
     *
     * @default errors
     */
    inputErrors?: string;
  };
  /**
   * Rules list that will be used in the validation process
   */
  rules?: Record<string, new (...args: any[]) => Rule>;
};
