# Meta Tech Provider App Review — submission checklist

Working notes for becoming a WhatsApp Business Platform Tech Provider so
barbershop tenants can bring their own number via Embedded Signup. Everything
here is a manual step in your Meta App Dashboard / Business Manager — nothing
in this file is submitted automatically.

## 1. Prerequisites (check before submitting)

- [x] Business verification — already completed (per your Meta Business
      Manager confirmation).
- [ ] Meta App has the **WhatsApp** use case added, with a connected business
      portfolio.
- [ ] App has a **Facebook Login for Business** configuration set up for
      **Embedded Signup v4** specifically (not v2 — v2 is deprecated
      2026-10-15, and this is a new integration so there's no reason to build
      the old one).
- [ ] App basic settings complete: app icon, privacy policy URL, terms of
      service URL, app category ("Business" or "Productivity").

## 2. Demo video script

Meta wants to see the WhatsApp Business Platform actually working end to end.
Record a screen capture (a phone screen + your terminal/dashboard is fine)
covering, in order:

1. **Send a message via the API** — trigger `whatsapp-webhook`/`whatsapp-worker`
   against your own test number (already working — this is exactly the
   pipeline built this session) and show the reply landing in a real WhatsApp
   client on a phone.
2. **Receive a message and show it processed** — send an inbound message from
   the phone, show it hitting the webhook (logs are fine) and the humanized
   reply (read receipt → typing → reply) appearing on the phone.
3. **Message template creation** — go to WhatsApp Manager, create one message
   template (e.g. an appointment-confirmation or reminder template — genuinely
   useful for Recepcionai's product regardless of app review), submit it for
   approval, and show the submission screen.

Narrate briefly what's on screen; it doesn't need to be polished, it needs to
be unambiguous that the integration is real and working.

## 3. Permission justification text

Meta's review form asks you to justify each Advanced Access permission in
your own words. Starting drafts below — edit to match your actual voice, but
the substance should hold up:

### `whatsapp_business_messaging`

> Recepcionai is an AI receptionist for Brazilian barbershops, delivered over
> WhatsApp. As a Tech Provider, we onboard each barbershop's own WhatsApp
> Business number via Embedded Signup, then use this permission to send and
> receive messages on that number on the shop's behalf: answering customer
> questions about services and availability, booking and confirming
> appointments, and sending day-of reminders to reduce no-shows. We do not
> send unsolicited marketing messages; all messages are customer-initiated
> conversations or business-initiated appointment confirmations/reminders
> tied to an existing booking.

### `whatsapp_business_management`

> This permission lets us read and manage the WABA assets (phone number
> status, message templates, business profile) that each barbershop connects
> to Recepcionai during onboarding, so we can complete phone number
> registration, submit the message templates their bookings flow needs
> (confirmations, reminders), and surface connection/health status back to
> the shop owner in our dashboard. We only access WABAs that a business
> owner has explicitly connected through Embedded Signup.

## 4. Client billing

Under the Tech Provider model, Meta bills conversations to whichever
WhatsApp Business Account is sending them — i.e. **each onboarded barbershop
needs its own payment method on file** with Meta, not you. Decide before
onboarding real customers whether Recepcionai:
- passes this cost through directly (shop enters their own card with Meta), or
- absorbs it and bakes it into your own pricing (you'd need your own
  mechanism to reconcile Meta's per-shop billing against what you charge).

This is a pricing/ops decision, not a technical one — flagged here so it
doesn't surprise you at onboarding time, not something to solve now.

## 5. After approval

Once Advanced Access is granted:
- Implement the Embedded Signup v4 JS SDK flow in the dashboard (`apps/web`)
  so a shop owner can connect their own number.
- Server-side: exchange the returned `code` for a customer-scoped access
  token, register the phone number (PIN-based `/register` call), and persist
  the result — this is the `whatsapp_channel` table work that's deliberately
  deferred until there's a real second tenant to onboard (see
  `whatsapp-webhook-pipeline-decision` memory for the schema sketch).
