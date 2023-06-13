import dayjs from "dayjs";

export function dateOutput(date: Date | any, format = "DD-MM-YYYY hh:mm:ss A") {
  // if format and timestamp exists, it means that the value is already parsed
  if (date?.format && date?.timestamp) return date;

  const dayjsDate = dayjs(date);

  return {
    format: dayjsDate.format(format),
    timestamp: dayjsDate.valueOf(),
    humanTime: (dayjsDate as any).fromNow(),
    text: new Intl.DateTimeFormat("en-US", {
      dateStyle: "long",
      timeStyle: "medium",
    }).format(dayjsDate.toDate()),
    date: new Intl.DateTimeFormat("en-US", {
      dateStyle: "long",
    }).format(dayjsDate.toDate()),
  };
}
