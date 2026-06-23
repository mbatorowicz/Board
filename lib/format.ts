const locale = "pl-PL";

export const formatDate = new Intl.DateTimeFormat(locale, {
  day: "numeric",
  month: "long",
  year: "numeric",
});

export const formatDateTime = new Intl.DateTimeFormat(locale, {
  day: "numeric",
  month: "long",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export const formatDateTimeLong = new Intl.DateTimeFormat(locale, {
  dateStyle: "long",
  timeStyle: "short",
});

export const formatWeekdayDate = new Intl.DateTimeFormat(locale, {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

export const formatTime = new Intl.DateTimeFormat(locale, {
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});

export const formatAdminDateTime = new Intl.DateTimeFormat(locale, {
  dateStyle: "medium",
  timeStyle: "short",
});

export function formatIso(value: string, formatter: Intl.DateTimeFormat): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return formatter.format(date);
}
