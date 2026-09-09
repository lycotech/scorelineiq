import Link from "next/link";
import { formatShortDate, toDateParam } from "../lib/format";

// A short window around today — matches the day-archive pages that
// already exist at /predictions/[date], just surfaced as quick tabs
// instead of requiring a URL edit to browse nearby days.
const DAYS_BEFORE = 1;
const DAYS_AFTER = 4;

export function DayTabs({ activeDate }: { activeDate: Date }) {
  const today = new Date();
  const todayParam = toDateParam(today);
  const activeParam = toDateParam(activeDate);

  const days = [];
  for (let offset = -DAYS_BEFORE; offset <= DAYS_AFTER; offset++) {
    days.push(
      new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() + offset)),
    );
  }

  return (
    <nav className="flex gap-2 overflow-x-auto pb-1">
      {days.map((date) => {
        const dateParam = toDateParam(date);
        const isToday = dateParam === todayParam;
        const isActive = dateParam === activeParam;
        const href = isToday ? "/" : `/predictions/${dateParam}`;
        const label = isToday ? `Today (${formatShortDate(date)})` : formatShortDate(date);

        return (
          <Link
            key={dateParam}
            href={href}
            className={`flex-shrink-0 rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
              isActive
                ? "bg-primary text-white"
                : "bg-background text-tertiary hover:bg-border hover:text-neutral"
            }`}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
