import config from "@mongez/config";
import { log } from "@mongez/logger";
import dayjs, { Dayjs } from "dayjs";
import timezone from "dayjs/plugin/timezone";
dayjs.extend(timezone);

export type DateOutputOptions = {
  /**
   * The format to be used for the date
   * Any dayjs format can be used
   * If set to false, it will not be returned in the date output object
   *
   * @default DD-MM-YYYY hh:mm:ss A
   */
  format?: string | false;
  /**
   * The timezone to be used for the date
   * If set to false, it will not converted to the timezone
   * Default value is from the config file located in app.timezone
   * @default app.timezone
   */
  timezone?: string | false;
  /**
   * If set to true, it will return a human readable time
   *
   * @default true
   */
  humanTime?: boolean;
  /**
   * If set to true, it will return a text representation of the date and time
   *
   * @default true
   */
  text?: boolean;
  /**
   * If set to true, it will return the date in UTC timestamp
   */
  utcTime?: boolean;
  /**
   * If set to true, it will return a text representation of the date only
   *
   * @default true
   */
  date?: boolean;
};

export type DateOutputReturn = {
  format?: string;
  humanTime?: string;
  text?: string;
  date?: string;
  timestamp?: number;
  utcTime?: number;
};

const defaultOptions: DateOutputOptions = {
  format: "DD-MM-YYYY hh:mm:ss A",
  humanTime: true,
  text: true,
  utcTime: true,
  date: true,
};

export function dateOutput(
  date: Date | Dayjs | any,
  options?: DateOutputOptions,
): DateOutputReturn | undefined {
  // if format and timestamp exists, it means that the value is already parsed
  if (!date || (date?.format && date?.timestamp)) {
    return date;
  }

  const optionsData = {
    ...defaultOptions,
    ...options,
  };

  try {
    let dayjsDate = dayjs(date);
    const timezone = optionsData.timezone || config.get("app.timezone");

    if (timezone) {
      dayjsDate = dayjsDate.tz(timezone);
    }

    const dateObject = dayjsDate.toDate();

    const outputObject: DateOutputReturn = {};

    if (optionsData.format) {
      outputObject.format = dayjsDate.format(optionsData.format);
    }

    if (optionsData.utcTime) {
      outputObject.timestamp = dayjsDate.valueOf();
    }

    if (optionsData.humanTime) {
      outputObject.humanTime = (dayjsDate as any).fromNow();
    }

    if (optionsData.text) {
      outputObject.text = new Intl.DateTimeFormat("en-US", {
        dateStyle: "long",
        timeStyle: "medium",
      }).format(dateObject);
    }

    if (optionsData.date) {
      outputObject.date = new Intl.DateTimeFormat("en-US", {
        dateStyle: "long",
      }).format(dateObject);
    }

    if (optionsData.utcTime) {
      outputObject.utcTime = dayjsDate.tz("UTC").valueOf();
    }

    return outputObject;
  } catch (error: any) {
    log.error("dateOutput", "error", error.message);

    return date;
  }
}
