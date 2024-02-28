import { describe, expect, test } from "vitest";
import { Model } from "../../mongodb";
import { LocalizedObject } from "./get-localized";
import { sluggable } from "./sluggable";

describe("sluggable", () => {
  test("sluggable using localized value", () => {
    const localizedValue: LocalizedObject[] = [
      {
        localeCode: "en",
        value: "Hello World",
      },
      {
        localeCode: "ar",
        value: "مرحبا",
      },
    ];

    const slugFactory = sluggable("name");

    const model = new Model({
      name: localizedValue,
    });

    const slug = slugFactory(model);

    expect(slug).toBe("hello-world");
  });

  test("Slugugable with a string value", () => {
    const name = "Hello World";

    const slugFactory = sluggable("name");

    const model = new Model({
      name,
    });

    const slug = slugFactory(model);

    expect(slug).toBe("hello-world");
  });

  test("Sluggable with missing column", () => {
    const slugFactory = sluggable("name");

    const model = new Model({});

    const slug = slugFactory(model);

    expect(slug).toBe("");
  });

  test("Sluggable with an object", () => {
    const slugFactory = sluggable("name");

    const model = new Model({
      name: {
        value: "Hello World",
      },
    });

    const slug = slugFactory(model);

    expect(slug).toBe("object-object");
  });
});
