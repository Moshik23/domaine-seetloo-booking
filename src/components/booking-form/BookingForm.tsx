"use client";

import { useState, useEffect, useRef } from "react";
import { useForm, useFieldArray, FormProvider, Controller } from "react-hook-form";
import { useRouter } from "next/navigation";
import { EventLineRow } from "./EventLineRow";
import { ConflictWarningBanner } from "./ConflictWarningBanner";
import { DateAdvisoryBanner } from "./DateAdvisoryBanner";
import { Field, inputClass } from "@/components/ui/Field";
import { TimeSelect } from "@/components/ui/TimeSelect";
import { VENUE_LABELS, DEFAULT_STAFF_NAME } from "@/lib/constants";
import { bookingInputSchema, type BookingInput } from "@/lib/validation";
import { checkConflicts } from "@/actions/bookings.actions";
import type { ConflictDetail, BookingLike } from "@/lib/conflicts";
import type { Venue } from "@/generated/prisma/enums";
import { todayIso, eachDateInRange } from "@/lib/dateUtils";

export interface BookingFormValues {
  formDate: string;
  surname: string;
  otherNames: string;
  phone1: string;
  phone2: string;
  address: string;
  dateIn: string;
  timeIn: string;
  dateOut: string;
  timeOut: string;
  occupancyVenue: Venue;
  agreedPrice: string;
  deposit: string;
  bookedByStaffName: string;
  notes: string;
  events: { label: string; venue: Venue; date: string; startTime: string; endTime: string }[];
}

const emptyEvent = () => ({ label: "", venue: "HALL" as Venue, date: "", startTime: "", endTime: "" });

export function defaultFormValues(): BookingFormValues {
  return {
    formDate: todayIso(),
    surname: "",
    otherNames: "",
    phone1: "",
    phone2: "",
    address: "",
    dateIn: "",
    timeIn: "",
    dateOut: "",
    timeOut: "",
    occupancyVenue: "HALL",
    agreedPrice: "",
    deposit: "",
    bookedByStaffName: DEFAULT_STAFF_NAME,
    notes: "",
    events: [emptyEvent()],
  };
}

export interface BookingWithEvents {
  formDate: string | null;
  surname: string;
  otherNames: string;
  phone1: string;
  phone2: string | null;
  address: string | null;
  dateIn: string;
  timeIn: string | null;
  dateOut: string;
  timeOut: string | null;
  occupancyVenue: Venue;
  agreedPrice: number;
  deposit: number;
  bookedByStaffName: string;
  notes: string | null;
  events: { label: string; venue: Venue; date: string; startTime: string; endTime: string | null }[];
}

export function bookingToFormValues(booking: BookingWithEvents): BookingFormValues {
  return {
    formDate: booking.formDate ?? "",
    surname: booking.surname,
    otherNames: booking.otherNames,
    phone1: booking.phone1,
    phone2: booking.phone2 ?? "",
    address: booking.address ?? "",
    dateIn: booking.dateIn,
    timeIn: booking.timeIn ?? "",
    dateOut: booking.dateOut,
    timeOut: booking.timeOut ?? "",
    occupancyVenue: booking.occupancyVenue,
    agreedPrice: String(booking.agreedPrice),
    deposit: String(booking.deposit),
    bookedByStaffName: booking.bookedByStaffName,
    notes: booking.notes ?? "",
    events:
      booking.events.length > 0
        ? booking.events.map((e) => ({
            label: e.label,
            venue: e.venue,
            date: e.date,
            startTime: e.startTime,
            endTime: e.endTime ?? "",
          }))
        : [emptyEvent()],
  };
}

export function toBookingInput(values: BookingFormValues): BookingInput {
  return {
    formDate: values.formDate || null,
    surname: values.surname,
    otherNames: values.otherNames,
    phone1: values.phone1,
    phone2: values.phone2 || null,
    address: values.address || null,
    dateIn: values.dateIn,
    timeIn: values.timeIn || null,
    dateOut: values.dateOut,
    timeOut: values.timeOut || null,
    occupancyVenue: values.occupancyVenue,
    agreedPrice: Number(values.agreedPrice),
    deposit: Number(values.deposit),
    bookedByStaffName: values.bookedByStaffName || DEFAULT_STAFF_NAME,
    notes: values.notes || null,
    events: values.events.map((e) => ({
      label: e.label,
      venue: e.venue,
      date: e.date,
      startTime: e.startTime,
      endTime: e.endTime || null,
    })),
  };
}

export interface BookingSubmitResult {
  success: boolean;
  error?: string;
  conflicts?: ConflictDetail[];
  id?: string;
}

interface BookingFormProps {
  defaultValues?: BookingFormValues;
  bookingId?: string;
  onSubmit: (input: BookingInput) => Promise<BookingSubmitResult>;
  submitLabel?: string;
}

export function BookingForm({
  defaultValues,
  bookingId,
  onSubmit,
  submitLabel = "Create Booking",
}: BookingFormProps) {
  const router = useRouter();
  const methods = useForm<BookingFormValues>({ defaultValues: defaultValues ?? defaultFormValues() });
  const {
    control,
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = methods;
  const { fields, append, remove } = useFieldArray({ control, name: "events" });

  const [liveConflicts, setLiveConflicts] = useState<ConflictDetail[]>([]);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitConflicts, setSubmitConflicts] = useState<ConflictDetail[]>([]);

  const watched = watch();
  const watchedKey = JSON.stringify([
    watched.events,
    watched.dateIn,
    watched.timeIn,
    watched.dateOut,
    watched.timeOut,
    watched.occupancyVenue,
    watched.surname,
  ]);

  const advisoryDates = (() => {
    const dates = new Set<string>();
    if (watched.dateIn && watched.dateOut && watched.dateIn <= watched.dateOut) {
      eachDateInRange(watched.dateIn, watched.dateOut).forEach((d) => dates.add(d));
    } else {
      if (watched.dateIn) dates.add(watched.dateIn);
      if (watched.dateOut) dates.add(watched.dateOut);
    }
    watched.events.forEach((e) => {
      if (e.date) dates.add(e.date);
    });
    return Array.from(dates);
  })();

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!watched.dateIn || !watched.dateOut) {
      setLiveConflicts([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      const draft: BookingLike = {
        id: bookingId,
        surname: watched.surname || "(new booking)",
        dateIn: watched.dateIn,
        timeIn: watched.timeIn || null,
        dateOut: watched.dateOut,
        timeOut: watched.timeOut || null,
        occupancyVenue: watched.occupancyVenue,
        events: watched.events
          .filter((e) => e.date && e.startTime)
          .map((e) => ({
            label: e.label || "(untitled)",
            venue: e.venue,
            date: e.date,
            startTime: e.startTime,
            endTime: e.endTime || null,
          })),
      };
      try {
        setLiveConflicts(await checkConflicts(draft, bookingId));
      } catch {
        // advisory only — the server-side check on submit is authoritative
      }
    }, 500);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchedKey, bookingId]);

  function recalculateOccupancyVenue() {
    const venues = new Set(watched.events.map((e) => e.venue));
    if (venues.has("BOTH") || (venues.has("HALL") && venues.has("CHALET"))) {
      setValue("occupancyVenue", "BOTH");
    } else if (venues.has("HALL")) {
      setValue("occupancyVenue", "HALL");
    } else if (venues.has("CHALET")) {
      setValue("occupancyVenue", "CHALET");
    }
  }

  async function submit(values: BookingFormValues) {
    setSubmitError(null);
    setSubmitConflicts([]);
    const input = toBookingInput(values);

    const parsed = bookingInputSchema.safeParse(input);
    if (!parsed.success) {
      setSubmitError(parsed.error.issues[0]?.message ?? "Please check the form for errors.");
      return;
    }

    const result = await onSubmit(input);
    if (!result.success) {
      setSubmitError(result.error ?? "Something went wrong.");
      setSubmitConflicts(result.conflicts ?? []);
      return;
    }
    if (result.id) {
      router.push(`/bookings/${result.id}?created=1`);
    } else {
      router.refresh();
    }
  }

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(submit)} className="space-y-6">
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Surname" error={errors.surname?.message}>
            <input className={inputClass} {...register("surname", { required: true })} />
          </Field>
          <Field label="Other Names">
            <input className={inputClass} {...register("otherNames")} />
          </Field>
          <Field label="Phone 1">
            <input className={inputClass} {...register("phone1", { required: true })} />
          </Field>
          <Field label="Phone 2">
            <input className={inputClass} {...register("phone2")} />
          </Field>
          <Field label="Address" className="sm:col-span-2">
            <input className={inputClass} {...register("address")} />
          </Field>
        </section>

        <section>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">Events</h2>
            <button
              type="button"
              onClick={() => append(emptyEvent())}
              className="rounded-md border border-neutral-300 px-2 py-1 text-xs font-medium hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800"
            >
              + Add Event
            </button>
          </div>
          <div className="space-y-2">
            {fields.map((field, index) => (
              <EventLineRow key={field.id} index={index} onRemove={() => remove(index)} />
            ))}
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Date In">
            <input type="date" className={inputClass} {...register("dateIn", { required: true })} />
          </Field>
          <Field label="Check In">
            <Controller
              control={control}
              name="timeIn"
              render={({ field }) => <TimeSelect value={field.value} onChange={field.onChange} allowEmpty />}
            />
          </Field>
          <Field label="Date Out">
            <input type="date" className={inputClass} {...register("dateOut", { required: true })} />
          </Field>
          <Field label="Check Out">
            <Controller
              control={control}
              name="timeOut"
              render={({ field }) => <TimeSelect value={field.value} onChange={field.onChange} allowEmpty />}
            />
          </Field>
        </section>

        <section>
          <Field label="Occupancy (which venue this booking blocks)">
            <div className="flex gap-2">
              <select className={`${inputClass} min-w-[10rem]`} {...register("occupancyVenue")}>
                {(Object.keys(VENUE_LABELS) as Array<keyof typeof VENUE_LABELS>).map((v) => (
                  <option key={v} value={v}>
                    {VENUE_LABELS[v]}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={recalculateOccupancyVenue}
                className="whitespace-nowrap rounded-md border border-neutral-300 px-3 py-2 text-xs font-medium hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800"
              >
                Set from events
              </button>
            </div>
          </Field>
        </section>

        <DateAdvisoryBanner dates={advisoryDates} />
        <ConflictWarningBanner conflicts={liveConflicts} />

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field label="Agreed Price (Rs)">
            <input type="number" min="0" className={inputClass} {...register("agreedPrice", { required: true })} />
          </Field>
          <Field label="Deposit (Rs, non-refundable)">
            <input type="number" min="0" className={inputClass} {...register("deposit", { required: true })} />
          </Field>
          <Field label="Booked By">
            <input className={inputClass} {...register("bookedByStaffName")} />
          </Field>
        </section>

        <Field label="Notes">
          <textarea rows={2} className={inputClass} {...register("notes")} />
        </Field>

        {submitError && (
          <div className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">
            {submitError}
          </div>
        )}
        <ConflictWarningBanner conflicts={submitConflicts} />

        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-md bg-rose-700 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-rose-800 disabled:opacity-50"
        >
          {isSubmitting ? "Saving..." : submitLabel}
        </button>
      </form>
    </FormProvider>
  );
}
