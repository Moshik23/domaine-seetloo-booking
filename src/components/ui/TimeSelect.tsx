const HOURS_12 = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, "0")); // "01".."12"
const MINUTES = ["00", "15", "30", "45"];
type Period = "AM" | "PM";

const selectClass =
  "rounded-md border border-neutral-300 bg-white px-1 py-2 text-sm focus:border-rose-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100";

function to24Hour(hour12: string, period: Period): string {
  let h = Number(hour12) % 12; // "12" -> 0
  if (period === "PM") h += 12;
  return String(h).padStart(2, "0");
}

function to12Hour(hour24: string): { hour12: string; period: Period } {
  const h = Number(hour24);
  const period: Period = h >= 12 ? "PM" : "AM";
  let h12 = h % 12;
  if (h12 === 0) h12 = 12;
  return { hour12: String(h12).padStart(2, "0"), period };
}

interface TimeSelectProps {
  /** "HH:mm" in 24-hour form (the domain format everywhere else in the app), or "". */
  value: string | null | undefined;
  onChange: (value: string) => void;
  /** When true, an unset hour/minute is allowed (renders a "--" option and emits ""). */
  allowEmpty?: boolean;
  className?: string;
}

/**
 * Hour (12h) + minute (15-min steps) + AM/PM dropdowns standing in for a native
 * <input type="time">, matching the 12-hour format used on the paper booking forms.
 * Still stores/emits plain 24-hour "HH:mm" strings — only the presentation is 12-hour.
 */
export function TimeSelect({ value, onChange, allowEmpty = false, className = "" }: TimeSelectProps) {
  const [h24, m] = value ? value.split(":") : ["", ""];
  const { hour12, period } = h24 ? to12Hour(h24) : { hour12: "", period: "AM" as Period };

  function setHour(newHour12: string) {
    if (newHour12 === "") {
      onChange("");
      return;
    }
    onChange(`${to24Hour(newHour12, period)}:${m || "00"}`);
  }

  function setMinute(newM: string) {
    if (newM === "") {
      onChange("");
      return;
    }
    onChange(`${to24Hour(hour12 || "12", period)}:${newM}`);
  }

  function setPeriod(newPeriod: Period) {
    if (hour12 === "") return; // nothing chosen yet — nothing meaningful to emit
    onChange(`${to24Hour(hour12, newPeriod)}:${m || "00"}`);
  }

  return (
    <div className={`flex flex-wrap gap-1 ${className}`}>
      <select value={hour12} onChange={(e) => setHour(e.target.value)} className={selectClass} aria-label="Hour">
        {allowEmpty && <option value="">--</option>}
        {HOURS_12.map((hh) => (
          <option key={hh} value={hh}>
            {hh}
          </option>
        ))}
      </select>
      <select value={m} onChange={(e) => setMinute(e.target.value)} className={selectClass} aria-label="Minute">
        {allowEmpty && <option value="">--</option>}
        {MINUTES.map((mm) => (
          <option key={mm} value={mm}>
            {mm}
          </option>
        ))}
      </select>
      <select
        value={period}
        onChange={(e) => setPeriod(e.target.value as Period)}
        className={selectClass}
        aria-label="AM/PM"
      >
        <option value="AM">AM</option>
        <option value="PM">PM</option>
      </select>
    </div>
  );
}
