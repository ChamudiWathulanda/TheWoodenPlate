const DATE_TIME_PATTERN =
  /(?<year>\d{4})-(?<month>\d{2})-(?<day>\d{2})(?:[T\s](?<hour>\d{2}):(?<minute>\d{2})(?::(?<second>\d{2}))?)?/;

const getParts = (value) => {
  if (!value || typeof value !== "string") return null;

  const match = value.match(DATE_TIME_PATTERN);
  if (!match?.groups) return null;

  return {
    year: Number(match.groups.year),
    month: Number(match.groups.month),
    day: Number(match.groups.day),
    hour: Number(match.groups.hour ?? 0),
    minute: Number(match.groups.minute ?? 0),
    second: Number(match.groups.second ?? 0),
  };
};

export const parsePromotionDateTime = (value) => {
  const parts = getParts(value);
  if (!parts) return null;

  return new Date(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second
  );
};

export const formatPromotionDateTime = (value, locale = "en-LK") => {
  const parsed = parsePromotionDateTime(value);
  if (!parsed) return "";

  return parsed.toLocaleString(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

export const formatPromotionDate = (value, locale = "en-US") => {
  const parsed = parsePromotionDateTime(value);
  if (!parsed) return "";

  return parsed.toLocaleDateString(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

export const toPromotionDateTimeInput = (value) => {
  const parts = getParts(value);
  if (!parts) return "";

  const pad = (number) => String(number).padStart(2, "0");
  return `${parts.year}-${pad(parts.month)}-${pad(parts.day)}T${pad(parts.hour)}:${pad(parts.minute)}`;
};

export const getPromotionTimeValue = (value) => {
  const parsed = parsePromotionDateTime(value);
  return parsed ? parsed.getTime() : null;
};
