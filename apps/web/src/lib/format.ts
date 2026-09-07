export function formatPercent(value: number): string {
  return `${Math.round(value * 100)}%`;
}

export function formatKickoff(date: Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
    hour12: false,
  }).format(date) + " UTC";
}

export function formatDateHeading(date: Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

export function toDateParam(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function parseDateParam(param: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(param)) return null;
  const date = new Date(`${param}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}
