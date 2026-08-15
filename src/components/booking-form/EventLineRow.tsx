import { useFormContext, Controller } from "react-hook-form";
import { EVENT_PRESETS, VENUE_LABELS } from "@/lib/constants";
import { inputClass } from "@/components/ui/Field";
import { TimeSelect } from "@/components/ui/TimeSelect";
import type { BookingFormValues } from "./BookingForm";

export function EventLineRow({ index, onRemove }: { index: number; onRemove: () => void }) {
  const { register, control } = useFormContext<BookingFormValues>();

  return (
    <div className="grid grid-cols-1 gap-2 rounded-md border border-neutral-200 p-3 lg:grid-cols-[1.2fr_1.1fr_0.9fr_1.3fr_1.3fr_auto] lg:items-start dark:border-neutral-800">
      <div>
        <input
          list={`event-presets-${index}`}
          placeholder="Event name (e.g. Haldi)"
          className={inputClass}
          {...register(`events.${index}.label`)}
        />
        <datalist id={`event-presets-${index}`}>
          {EVENT_PRESETS.map((p) => (
            <option key={p} value={p} />
          ))}
        </datalist>
      </div>

      <select className={`${inputClass} min-w-[9rem]`} {...register(`events.${index}.venue`)}>
        {(Object.keys(VENUE_LABELS) as Array<keyof typeof VENUE_LABELS>).map((v) => (
          <option key={v} value={v}>
            {VENUE_LABELS[v]}
          </option>
        ))}
      </select>

      <input type="date" className={inputClass} {...register(`events.${index}.date`)} />

      <div>
        <Controller
          control={control}
          name={`events.${index}.startTime`}
          render={({ field }) => <TimeSelect value={field.value} onChange={field.onChange} />}
        />
      </div>

      <div>
        <Controller
          control={control}
          name={`events.${index}.endTime`}
          render={({ field }) => <TimeSelect value={field.value} onChange={field.onChange} />}
        />
        <p className="mt-0.5 text-[10px] text-neutral-400 dark:text-neutral-600">optional end time</p>
      </div>

      <button
        type="button"
        onClick={onRemove}
        className="rounded-md px-2 text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
        aria-label="Remove event"
      >
        Remove
      </button>
    </div>
  );
}
