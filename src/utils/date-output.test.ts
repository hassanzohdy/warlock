import { bootstrap } from "@mongez/warlock";
import { beforeAll, expect, test } from "vitest";
import { dateOutput } from "./date-output";

beforeAll(async () => {
  await bootstrap();
});

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

test("date-output-with-different-locale-code", () => {
  require("dayjs/locale/ar");
  const output = dateOutput(new Date(), {
    locale: "ar",
  });

  expect(output?.format).toBeTypeOf("string");
  // validate the output format to contain arabic characters
  expect(output?.format).toMatch(/[\u0600-\u06FF]/);
});

test("date-output-with-minimal-features", () => {
  const output = dateOutput(new Date(), {
    humanTime: false,
  });

  expect(output?.humanTime).toBeUndefined();

  const output2 = dateOutput(new Date(), {
    time: false,
  });

  expect(output2?.time).toBeUndefined();

  const output3 = dateOutput(new Date(), {
    date: false,
  });

  expect(output3?.date).toBeUndefined();

  const output4 = dateOutput(new Date(), {
    timestamp: false,
  });

  expect(output4?.timestamp).toBeUndefined();

  const output5 = dateOutput(new Date(), {
    offset: false,
  });

  expect(output5?.offset).toBeUndefined();

  const output6 = dateOutput(new Date(), {
    text: false,
  });

  expect(output6?.text).toBeUndefined();

  const output7 = dateOutput(new Date(), {
    format: false,
  });

  expect(output7?.format).toBeUndefined();
});
