import Link from "next/link";
import { toDateParam } from "../lib/format";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

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
        const label = isToday ? "Today" : DAY_LABELS[date.getUTCDay()];

        return (
          <Link
            key={dateParam}
            href={href}
            className={`flex-shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              isActive
                ? "bg-blue-600 text-white"
                : "bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-slate-800 dark:text-blue-300 dark:hover:bg-slate-700"
            }`}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
