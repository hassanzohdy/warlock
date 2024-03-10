import config from "@mongez/config";
import { log } from "@mongez/logger";
import dayjs, { Dayjs } from "dayjs";
import timezone from "dayjs/plugin/timezone.js";
import { requestContext } from "../http/middleware/inject-request-context";

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
   * If set to true, it will return the date in timestamp
   *
   * @default true
   */
  timestamp?: boolean;
  /**
   * If set to true, it will return a text representation of the date only
   *
   * @default true
   */
  date?: boolean;
  /**
   * Return ony the time
   *
   * @default true
   */
  time?: boolean;
  /**
   * Return the offset from the UTC time
   */
  offset?: boolean;
  /**
   * Locale code
   *
   * Please note that you must import the dayjs locale file before using it
   */
  locale?: string;
};

export type DateOutputReturn = {
  format?: string;
  humanTime?: string;
  text?: string;
  date?: string;
  timestamp?: number;
  time?: string;
  offset?: number;
};

const defaultOptions: DateOutputOptions = {
  format: "DD-MM-YYYY hh:mm:ss A",
  humanTime: true,
  text: true,
  date: true,
  timestamp: true,
  time: true,
  offset: true,
};

export function dateOutput(
  date: Date | Dayjs | any,
  options?: DateOutputOptions,
): DateOutputReturn | undefined {
  // if format and timestamp exists, it means that the value is already parsed
  if (!date || (date?.format && date?.timestamp)) {
    return date;
  }

  if (!date?.getTime) return date;

  const optionsData = {
    ...defaultOptions,
    ...options,
  };

  if (!optionsData.locale) {
    const { request } = requestContext();
    optionsData.locale = request?.locale;
  }

  try {
    let dayjsDate = dayjs(date);
    const timezone = optionsData.timezone || config.get("app.timezone");

    if (timezone) {
      dayjsDate = dayjsDate.tz(timezone);
    }

    if (optionsData?.locale) {
      dayjsDate = dayjsDate.locale(optionsData.locale);
    }

    const outputObject: DateOutputReturn = {};

    if (optionsData.format) {
      outputObject.format = dayjsDate.format(optionsData.format);
    }

    if (optionsData.timestamp) {
      outputObject.timestamp = date.getTime();
    }

    if (optionsData.offset) {
      outputObject.offset = dayjsDate.utcOffset();
    }

    if (optionsData.humanTime) {
      outputObject.humanTime = (dayjsDate as any).fromNow();
    }

    if (optionsData.text) {
      outputObject.text = dayjsDate.format(
        "dddd, MMMM DD, YYYY [at] h:mm:ss A",
      );
    }

    if (optionsData.date) {
      outputObject.date = dayjsDate.format("dddd, MMMM DD, YYYY");
    }

    if (optionsData.time) {
      outputObject.time = dayjsDate.format("h:mm:ss A");
    }

    return outputObject;
  } catch (error: any) {
    log.error("dateOutput", "error", error.message);

    console.log("error", error);

    return date;
  }
}
