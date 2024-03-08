import config from "@mongez/config";
import { colors } from "@mongez/copper";
import { Rule } from "./rules";
import { Validation } from "./types";
import { ValidationSchema } from "./validation-schema";

export function getValidationSchema(
  rules:
    | ValidationSchema
    | Validation
    | Record<string, ValidationSchema | (string | Rule)[]>,
) {
  if (rules instanceof ValidationSchema === false) {
    return new ValidationSchema(rules);
  }

  return rules;
}

export function getRuleHandler(rule: string | Rule) {
  let ruleOptions: any[] = [];
  if (typeof rule === "string") {
    if (rule.includes(":")) {
      const [baseRuleName, gluedRuleOptions] = rule.split(":");

      ruleOptions = gluedRuleOptions.split(",");
      rule = baseRuleName;
    }

    const RuleClass = config.get(`validation.rules.${rule}`);

    if (!RuleClass) {
      throw new Error(
        colors.bold(
          `Missing Validation Rule: ${colors.redBright(
            rule + " rule",
          )} is not listed under the configurations of ${colors.cyan(
            "validation.rules",
          )} list`,
        ),
      );
    }

    rule = new RuleClass();
  }

  (rule as Rule).setOptions(ruleOptions);

  return rule as Rule;
}
