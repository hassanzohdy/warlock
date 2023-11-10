import config from "@mongez/config";
import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
dayjs.extend(timezone);

export function dateOutput(date: Date | any, format = "DD-MM-YYYY hh:mm:ss A") {
  // if format and timestamp exists, it means that the value is already parsed
  if (!date || (date?.format && date?.timestamp)) return date;

  try {
    let dayjsDate = dayjs(date);
    const timezone = config.get("app.timezone");

    if (timezone) {
      dayjsDate = dayjsDate.tz(timezone);
    }

    const dateObject = dayjsDate.toDate();

    return {
      format: dayjsDate.format(format),
      timestamp: dayjsDate.valueOf(),
      humanTime: (dayjsDate as any).fromNow(),
      text: new Intl.DateTimeFormat("en-US", {
        dateStyle: "long",
        timeStyle: "medium",
      }).format(dateObject),
      date: new Intl.DateTimeFormat("en-US", {
        dateStyle: "long",
      }).format(dateObject),
    };
  } catch (error: any) {
    return;
  }
}
