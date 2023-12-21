import { type Model } from "@mongez/monpulse";
import { sluggable } from "../../utils";

export function Sluggable(column = "title") {
  const slug = sluggable(column);
  return function (ChildModel: typeof Model) {
    ChildModel.events().onSaving(model => {
      model.set("slug", slug(model));
    });
  };
}
