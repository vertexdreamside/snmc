"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AlertTriangle, Lock, MessageCircleQuestion, ShieldCheck } from "lucide-react";
import type { Room, Availability, Pricing, SiteInfo } from "@/lib/content";
import { whatsAppLink, FEATURES } from "@/lib/content";
import { computeStay, seasonLabel } from "@/lib/booking";
import BookingRequestModal from "@/components/BookingRequestModal";
import DateField from "@/components/DateField";
import { fromISODate } from "@/lib/date";

const compactSchema = z.object({
  arrival: z.string().min(1, "Required"),
  departure: z.string().min(1, "Required"),
  adults: z.string(),
  children: z.string(),
});

const panelSchema = z.object({
  arrival: z.string().min(1, "Required"),
  departure: z.string().min(1, "Required"),
  room: z.string().min(1, "Required"),
  guests: z.string(),
});

type CompactValues = z.infer<typeof compactSchema>;
type PanelValues = z.infer<typeof panelSchema>;

/** Every room's blocked dates merged — used where no single room is selected yet. */
function allBlockedDates(availability: Availability): string[] {
  return Array.from(new Set(Object.values(availability.blockedDates).flat()));
}

/**
 * Homepage widget — a general availability search, not room-specific.
 * It checks the minimum-stay rule for the dates picked, then hands the
 * guest off to the Rooms page (with dates carried over) to see the
 * actual rate, offers and terms for a specific room.
 */
export function BookingWidgetCompact({
  availability,
  pricing,
  site,
  rooms,
}: {
  availability: Availability;
  pricing: Pricing;
  site: SiteInfo;
  rooms: Room[];
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<CompactValues>({
    resolver: zodResolver(compactSchema),
    defaultValues: { arrival: "", departure: "", adults: "2", children: "0" },
  });
  const arrival = watch("arrival");
  const departure = watch("departure");
  const adults = watch("adults");
  const children = watch("children");
  const blocked = useMemo(() => allBlockedDates(availability), [availability]);

  const stay = useMemo(() => {
    if (!arrival || !departure) return null;
    return computeStay(pricing, arrival, departure);
  }, [arrival, departure, pricing]);

  const unknownSeason = Boolean(stay && stay.season === null);
  const blockedByMinStay = Boolean(stay && stay.season !== null && !stay.meetsMinStay);

  const onSubmit = handleSubmit(() => {
    if (unknownSeason || blockedByMinStay) return; // blocked — message shown below
    setModalOpen(true);
  });

  return (
    <div
      id="booking"
      className="bg-white rounded-3xl shadow-[0_30px_60px_-24px_rgba(15,61,46,0.4)] p-5 sm:p-6 md:p-7 mt-6 sm:mt-4 md:-mt-14 relative z-[5]"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 items-end">
        <Controller
          control={control}
          name="arrival"
          render={({ field }) => (
            <DateField label="Arrival" value={field.value} onChange={field.onChange} blockedDates={blocked} />
          )}
        />
        <Controller
          control={control}
          name="departure"
          render={({ field }) => (
            <DateField
              label="Departure"
              value={field.value}
              onChange={field.onChange}
              blockedDates={blocked}
              minDate={arrival ? fromISODate(arrival) : undefined}
            />
          )}
        />
        <Field label="Adults">
          <Controller
            control={control}
            name="adults"
            render={({ field }) => (
              <select {...field} className="field-input">
                {[1, 2, 3, 4].map((n) => (
                  <option key={n}>{n}</option>
                ))}
              </select>
            )}
          />
        </Field>
        <Field label="Children">
          <Controller
            control={control}
            name="children"
            render={({ field }) => (
              <select {...field} className="field-input">
                {[0, 1, 2].map((n) => (
                  <option key={n}>{n}</option>
                ))}
              </select>
            )}
          />
        </Field>
        <button
          type="button"
          onClick={onSubmit}
          disabled={unknownSeason || blockedByMinStay}
          className="btn-primary justify-center whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Check Availability
        </button>
      </div>
      {(errors.arrival || errors.departure) && (
        <p className="text-xs text-red-600 mt-3">Pick your arrival and departure dates.</p>
      )}
      {blockedByMinStay && stay && (
        <p className="flex items-center gap-2 text-sm text-red-600 mt-3">
          <AlertTriangle size={15} className="shrink-0" />A minimum stay of {stay.minNights} nights is required for
          the selected dates ({seasonLabel(stay.season)}).
        </p>
      )}
      {unknownSeason && (
        <p className="flex items-start gap-2 text-sm text-ink-soft mt-3">
          <MessageCircleQuestion size={15} className="shrink-0 mt-0.5" />
          <span>
            Rates for these dates aren&apos;t published yet —{" "}
            <a
              href={whatsAppLink(site, "Hello, I'd like to check rates and availability for some dates that aren't listed on your site yet.")}
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-green-deep"
            >
              message us on WhatsApp
            </a>{" "}
            and we&apos;ll help directly.
          </span>
        </p>
      )}

      {stay && !unknownSeason && !blockedByMinStay && (
        <BookingRequestModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          site={site}
          rooms={rooms}
          arrival={arrival}
          departure={departure}
          adults={adults}
          children={children}
          nights={stay.nights}
          seasonLabel={seasonLabel(stay.season)}
        />
      )}
    </div>
  );
}

export function BookingPanel({
  rooms,
  availability,
  pricing,
  site,
}: {
  rooms: Room[];
  availability: Availability;
  pricing: Pricing;
  site: SiteInfo;
}) {
  const searchParams = useSearchParams();
  const {
    control,
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
  } = useForm<PanelValues>({
    resolver: zodResolver(panelSchema),
    defaultValues: {
      arrival: "",
      departure: "",
      room: rooms[0]?.slug ?? "",
      guests: rooms[0]?.guestOptions[0] ?? "2 Adults",
    },
  });
  const [modalOpen, setModalOpen] = useState(false);

  // Carry over dates picked in the homepage's compact widget, if present.
  useEffect(() => {
    const arrival = searchParams.get("arrival");
    const departure = searchParams.get("departure");
    if (arrival || departure) {
      reset((prev) => ({ ...prev, arrival: arrival ?? prev.arrival, departure: departure ?? prev.departure }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const arrival = watch("arrival");
  const departure = watch("departure");
  const roomSlug = watch("room");
  const guests = watch("guests");
  const room = rooms.find((r) => r.slug === roomSlug);
  const roomName = room?.name;
  const guestOptions = room?.guestOptions ?? [];
  const blocked = useMemo(() => availability.blockedDates[roomSlug] ?? [], [availability, roomSlug]);

  // Keep the selected Guests value valid for whichever room is currently chosen.
  useEffect(() => {
    if (guestOptions.length > 0 && !guestOptions.includes(guests)) {
      setValue("guests", guestOptions[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomSlug]);

  const stay = useMemo(() => {
    if (!arrival || !departure) return null;
    return computeStay(pricing, arrival, departure, roomName);
  }, [arrival, departure, roomName, pricing]);

  const unknownSeason = Boolean(stay && stay.season === null);
  const blockedByMinStay = Boolean(stay && stay.season !== null && !stay.meetsMinStay);
  const isBlocked = unknownSeason || blockedByMinStay;

  const onSubmit = handleSubmit(() => {
    if (isBlocked) return; // blocked — message shown below
    setModalOpen(true);
  });

  return (
    <div id="booking" className="bg-white rounded-3xl shadow-soft p-6 sm:p-8 md:p-11">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Controller
          control={control}
          name="arrival"
          render={({ field }) => (
            <DateField label="Arrival Date" value={field.value} onChange={field.onChange} blockedDates={blocked} />
          )}
        />
        <Controller
          control={control}
          name="departure"
          render={({ field }) => (
            <DateField
              label="Departure Date"
              value={field.value}
              onChange={field.onChange}
              blockedDates={blocked}
              minDate={arrival ? fromISODate(arrival) : undefined}
            />
          )}
        />
        <Field label="Room Type">
          <select {...register("room")} className="field-input">
            {rooms.map((r) => (
              <option key={r.slug} value={r.slug}>
                {r.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Guests">
          <select {...register("guests")} className="field-input">
            {guestOptions.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
        </Field>
      </div>

      {/* ===== Rate / offers / terms — only revealed once dates are picked ===== */}
      {stay && unknownSeason && (
        <div className="flex items-start gap-3 mt-6 px-4 py-4 bg-sand-deep border border-granite-light rounded-2xl text-sm text-ink-soft">
          <MessageCircleQuestion size={18} className="shrink-0 mt-0.5 text-green-deep" />
          <span>
            Rates for these dates aren&apos;t published yet.{" "}
            <a
              href={whatsAppLink(site, "Hello, I'd like to check rates and availability for some dates that aren't listed on your site yet.")}
              target="_blank"
              rel="noopener noreferrer"
              className="underline text-green-deep hover:text-green-mid"
            >
              Message us on WhatsApp
            </a>{" "}
            and we&apos;ll confirm pricing directly.
          </span>
        </div>
      )}

      {stay && blockedByMinStay && (
        <div className="flex items-start gap-3 mt-6 px-4 py-4 bg-red-50 border border-red-200 rounded-2xl text-sm text-red-700">
          <AlertTriangle size={18} className="shrink-0 mt-0.5" />
          <span>
            A minimum stay of <strong>{stay.minNights} nights</strong> is required for the selected dates (
            {seasonLabel(stay.season)}). Please adjust your arrival or departure date to continue.
          </span>
        </div>
      )}

      {stay && !isBlocked && (
        <div className="mt-6 rounded-2xl border border-granite-light overflow-hidden">
          <div className="bg-green-pale px-5 py-4 flex flex-wrap items-baseline justify-between gap-2">
            <div>
              <span className="text-xs uppercase tracking-wide text-ink-soft font-semibold">
                {seasonLabel(stay.season)} · {stay.nights} night{stay.nights === 1 ? "" : "s"}
              </span>
              {stay.nightlyRate != null && (
                <p className="font-display text-2xl text-green-deep mt-0.5">
                  €{stay.nightlyRate}{" "}
                  <span className="text-sm font-body text-ink-soft">/ night · €{stay.totalRate} total, B&amp;B</span>
                </p>
              )}
            </div>
            {(stay.earlyBirdEligible || stay.longStayEligible) && (
              <div className="flex flex-col items-end gap-1">
                {stay.earlyBirdEligible && (
                  <span className="bg-gold text-green-deep text-xs font-semibold px-3 py-1.5 rounded-full">
                    Early Bird: {stay.earlyBirdPct}% off available
                  </span>
                )}
                {stay.longStayEligible && (
                  <span className="bg-gold text-green-deep text-xs font-semibold px-3 py-1.5 rounded-full">
                    Long Stay: 15% off available
                  </span>
                )}
              </div>
            )}
          </div>
          <div className="px-5 py-4 text-sm text-ink-soft space-y-2">
            <p className="flex items-start gap-2">
              <ShieldCheck size={16} className="text-green-deep shrink-0 mt-0.5" />
              <span>
                <strong className="text-ink">Terms &amp; Conditions —</strong> {stay.depositText} {stay.cancellationText}
              </span>
            </p>
          </div>
        </div>
      )}

      {FEATURES.roomBookingEnabled ? (
        <>
          <button
            type="button"
            onClick={onSubmit}
            disabled={isBlocked}
            className="btn-primary mt-6 w-full sm:w-auto justify-center bg-green-deep text-sand disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Check Availability
          </button>
          <div className="flex items-center gap-3 mt-6 px-4 py-4 bg-green-pale rounded-2xl text-sm text-ink-soft">
            <Lock size={18} className="text-green-deep shrink-0" />
            <span>
              <strong className="text-green-deep">What happens next</strong> — this sends an availability request,
              not a confirmed booking. We&apos;ll reply by email to confirm availability and arrange next steps.
            </span>
          </div>
        </>
      ) : (
        <div className="flex items-start gap-3 mt-6 px-4 py-4 bg-green-pale rounded-2xl text-sm text-ink-soft">
          <MessageCircleQuestion size={18} className="shrink-0 mt-0.5 text-green-deep" />
          <span>
            To check availability and enquire for these dates, use the{" "}
            <a href="/#booking" className="underline text-green-deep font-medium">
              Check Availability
            </a>{" "}
            widget on the homepage, or{" "}
            <a
              href={whatsAppLink(site, "Hello, I'd like to check availability for a stay at Sibert Residence.")}
              target="_blank"
              rel="noopener noreferrer"
              className="underline text-green-deep font-medium"
            >
              message us on WhatsApp
            </a>
            .
          </span>
        </div>
      )}

      {FEATURES.roomBookingEnabled && stay && !isBlocked && (
        <BookingRequestModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          site={site}
          rooms={rooms}
          arrival={arrival}
          departure={departure}
          adults=""
          children=""
          nights={stay.nights}
          seasonLabel={seasonLabel(stay.season)}
          initialRoomSlug={roomSlug}
          initialGuests={guests}
        />
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[0.72rem] uppercase tracking-wide text-ink-soft font-semibold">{label}</label>
      {children}
    </div>
  );
}

