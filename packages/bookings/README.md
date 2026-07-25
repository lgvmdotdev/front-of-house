# @workspace/bookings

The booking-integration engine. Defines a provider-agnostic `BookingEngine`
contract that every scheduling integration implements. **Google Calendar and
Google Sheets are the first two adapters** — the same port will back Trinks,
Booksy, Belezito, etc. The shop's tool stays the source of truth; we read and
write it, we don't replace it.

- **Port** — [`BookingEngine`](./src/port.ts): `listServices`,
  `listProfessionals`, `getAvailability`, `createBooking`, `cancelBooking`,
  `rescheduleBooking`, `listBookings`, `getBooking`.
- **Calendar adapter** — [`GoogleCalendarBookingEngine`](./src/calendar/adapter.ts)
  over a thin [`CalendarClient`](./src/calendar/client.ts) seam. The default for
  shops with no existing tool. The real `GoogleCalendarClient` wraps
  `@googleapis/calendar`; tests inject an in-memory calendar.
- **Sheets adapter** — [`SpreadsheetBookingEngine`](./src/sheets/adapter.ts)
  over a thin [`SheetsClient`](./src/sheets/client.ts) seam. The real
  `GoogleSheetsClient` wraps `@googleapis/sheets`; tests inject an in-memory grid.
- **Fake** — [`FakeBookingEngine`](./src/fake.ts): in-memory reference
  implementation and test double (no mocking of internal code).
- **Pure logic** — [availability](./src/availability.ts) (slot computation) and
  [time](./src/time.ts) live separately and are heavily unit-tested.

## Conventions

- Money is integer **cents** in BRL. Durations are whole **minutes**.
- Instants are `Date` (UTC). Working hours are local `"HH:MM"`, resolved against
  a **fixed UTC offset** (default −03:00, São Paulo). Brazil has had no DST since
  2019, so a per-shop fixed offset is correct — no timezone database needed.
- Errors are typed ([`errors.ts`](./src/errors.ts)) with a discriminant `code`,
  so callers branch on failure kind instead of string-matching.

## Google Calendar adapter

The default "works out of the box" integration. Calendar has no concept of
services, barbers, or working hours — so the **catalog is configuration** we
inject; the calendar holds the actual appointments and busy time.

- **Each professional maps to a `calendarId`.** Give every barber their own
  calendar for true per-barber availability, or point several at one shared shop
  calendar (they then share busy time) — same code, no flag.
- **A booking is a calendar event.** `serviceId` / `professionalId` / customer
  live in the event's `extendedProperties.private`, tagged with an app marker —
  so the professional is reliable even on a shared calendar, and the barber's own
  personal entries are never mistaken for bookings.
- **Availability** comes from the freebusy API, so the barber's personal events
  block slots too. **Cancellation** marks the event transparent (frees the slot)
  and flags it cancelled in our metadata, keeping it retrievable.

```ts
import { GoogleCalendarBookingEngine, GoogleCalendarClient } from "@workspace/bookings";

const engine = new GoogleCalendarBookingEngine({
  client: new GoogleCalendarClient({ auth: serviceAccountAuth }),
  services: [{ id: "svc-corte", name: "Corte", durationMinutes: 60, price: { amountCents: 5000, currency: "BRL" } }],
  professionals: [
    {
      professional: {
        id: "pro-felipe",
        name: "Felipe",
        serviceIds: ["svc-corte"],
        workingHours: [{ weekday: 5, start: "09:00", end: "18:00" }],
      },
      calendarId: "felipe@barbearia.com", // share the calendar with the service account
    },
  ],
});

const slots = await engine.getAvailability({
  serviceId: "svc-corte",
  professionalId: "pro-felipe",
  from: new Date(),
  to: new Date(Date.now() + 7 * 864e5),
});
await engine.createBooking({
  serviceId: "svc-corte",
  professionalId: "pro-felipe",
  customer: { name: "Ana", phone: "5511999998888" },
  start: slots[0].start,
});
```

## Spreadsheet layout

One tab per entity; row 1 is a header. **Columns are matched by header name**
(case-insensitive), not position — a shop owner can reorder columns safely.

| Tab             | Columns |
| --------------- | ------- |
| `Services`      | `id`, `name`, `duration_minutes`, `price_cents` |
| `Professionals` | `id`, `name`, `service_ids` (comma-separated) |
| `Hours`         | `professional_id`, `weekday` (0=Sun…6=Sat), `start` (`HH:MM`), `end` (`HH:MM`) |
| `Appointments`  | `id`, `service_id`, `professional_id`, `customer_name`, `customer_phone`, `start` (ISO), `end` (ISO), `status` (`confirmed`/`cancelled`), `notes`, `created_at` (ISO) |

## Usage

```ts
import { GoogleSheetsClient, SpreadsheetBookingEngine } from "@workspace/bookings";
import { auth } from "@googleapis/sheets";

const engine = new SpreadsheetBookingEngine({
  client: new GoogleSheetsClient({
    spreadsheetId: shop.spreadsheetId,
    auth: serviceAccountAuth, // share the sheet with the service account email
  }),
  // offsetMinutes defaults to -180 (São Paulo)
});

const slots = await engine.getAvailability({
  serviceId: "svc-corte",
  from: new Date(),
  to: new Date(Date.now() + 7 * 864e5),
});

const booking = await engine.createBooking({
  serviceId: "svc-corte",
  professionalId: "pro-felipe",
  customer: { name: "Ana", phone: "5511999998888" },
  start: slots[0].start,
});
```

## Testing

```ts
import { FakeBookingEngine } from "@workspace/bookings";

const engine = new FakeBookingEngine({
  services: [corte],
  professionals: [felipe],
  now: () => fixedDate,
});
// drive createBooking/getAvailability/… and assert
```

The Sheets adapter is tested by injecting an in-memory `SheetsClient` (see
[`adapter.test.ts`](./src/sheets/adapter.test.ts)) — no network, no credentials.
Run the suite with `bun test`.
