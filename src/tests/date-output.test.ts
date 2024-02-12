import { expect, test } from "vitest";
import { dateOutput } from "../utils";

// TODO: Complete all combinations of using the dateOutput function options

test("date-output", () => {
  const date = new Date("2021-01-15");
  const output = dateOutput(date);

  expect(output?.format).toBeTypeOf("string");
  expect(output?.text).toBeTypeOf("string");
  expect(output?.humanTime).toBeTypeOf("string");
  expect(output?.time).toBeTypeOf("string");
  expect(output?.date).toBeTypeOf("string");
  expect(output?.timestamp).toBeTypeOf("number");
  expect(output?.offset).toBeTypeOf("number");
});

test("invalid-date-output", () => {
  const output = dateOutput({});

  expect(output).toBeTypeOf("object");
  expect(output).toStrictEqual({});
});
