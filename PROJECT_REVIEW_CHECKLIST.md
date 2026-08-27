# Vinayaka Vedika — completion and review checklist

This is the handoff checklist for the completed code pass. Items marked complete are implemented in the repository and still need real-environment verification where noted. Items under suggestions are intentionally outside the current release.

## Completed in this pass

- [x] IST-safe client date calculation for festival dates, schedules, notices, and daily defaults.
- [x] Existing edit dialog connected to donation and expense records for Committee users.
- [x] Donation and expense amounts normalized to numbers before writes.
- [x] Supabase mutation failures returned to callers and retained in portal error state instead of being silently swallowed.
- [x] Receipt generation changed from interpolated HTML to DOM text assignment, with blocked-popup handling.
- [x] Ask endpoint rejects empty, non-string, and overlong questions.
- [x] Web Push notification icon added and referenced by the service worker.
- [x] Web app manifest and favicon linked from the document head.

Use the sections below to verify the full application in a configured Supabase/Vercel environment.

## Requirements document review

- [x] FR-1 Overview: countdown, live stats, celebration details, emergency contacts, and portal shell.
- [x] FR-2 Community: committee directory, notices, and volunteer roster.
- [x] FR-3/4 Money: donations, expenses, totals, search, sorting, tiers, UPI QR, receipts, and editing.
- [x] FR-5 Purchases: year grouping, totals, reusable inventory, and condition notes.
- [x] FR-6 Bidding: auction items, highest-bid history, close action, and automatic winning-bid donation.
- [x] FR-7/8 Schedule: date grouping, daily timings, calendar links, `.ics` downloads, and 30-minute calendar alarms.
- [x] FR-9 Sponsors: prasad / bhandara sponsor records.
- [x] FR-10/11 Recognition: awards, nominees, public vote, and live tally.
- [x] FR-12 Memories: compressed photo upload, video/album links, year grouping, and lightbox.
- [x] FR-13 Help: server-side AI guidance proxy with bounded question input.
- [x] FR-14 Backup: Committee-only JSON export of all loaded portal records.
- [x] UI refresh: responsive operations dashboard styling, clearer hierarchy, improved forms, navigation, and mobile layout.
- [x] Media folders: All, Photos, and Videos filters over the existing gallery records.
- [x] Music playlist: Supabase-backed playlist links with Committee add, edit, reorder, and delete controls.
- [x] Atomic bidding: database RPCs lock the auction row, validate the highest bid, record history, and close auctions safely.
- [x] Shared admin passcode: first-time setup, sign-in, sign-out, reset, and Supabase RPC verification.
- [x] Async add forms: visible saving state and inline Supabase error feedback.
- [x] Record actions: edit and delete controls now have distinct visual treatments.
- [x] Gallery upload copy: device photo upload and external video/album link paths are labeled separately.
- [ ] FR-8.5 automatic reminder delivery: deploy and verify the hosted Vercel Cron and Web Push configuration.
- [ ] Production acceptance: apply migrations, create the first admin passcode, and test public/admin access with real data.
- [ ] Apply `20260825_music_playlist.sql` after the existing Phase 1 and Phase 2 migrations.
- [ ] Apply `20260825_bidding_integrity.sql` after the Phase 2 migration.
- [ ] Apply `20260825_passcode_auth.sql` after the Phase 2 migration.

## Quality prompt follow-up

- [ ] Split `App.jsx` into `features/` modules; current file remains a legacy composition/rendering module.
- [ ] Replace remaining native `alert()` / `confirm()` calls in non-auth actions with the shared modal system.
- [ ] Add edit controls to every remaining admin list and automated tests for public/admin persistence.
- [ ] Add storage-usage warnings and complete native-language review.

## Decisions needed before launch

- [ ] Confirm this year's lunar-calendar festival date.
- [ ] Confirm the contribution tier thresholds: ₹1,000, ₹5,000, and ₹10,000.
- [ ] Decide whether records carry forward each year or are archived and reset.
- [ ] Confirm whether the default 30-minute calendar reminder is appropriate.
- [ ] Decide whether WhatsApp remains the primary reminder channel or Web Push should be enabled.
- [ ] Decide whether auction items need photos.
- [ ] Decide whether older purchase records should be back-filled.
- [ ] Decide whether the AI Help section should be enabled for every visitor.

## 1. Project setup

- [x] React + JavaScript portal created with mobile-first styling.
- [x] Supabase client configuration is isolated in `src/lib/supabase.js`.
- [x] Environment-variable template is present in `.env.example`.
- [x] Production build completed successfully with `npm.cmd run build`.
- [ ] Create a Supabase project and apply migrations in filename order.
- [ ] Add production environment values in Vercel; never expose service, VAPID-private, cron, or Anthropic keys to the browser.

## 2. Phase 1 — festival portal

- [x] Overview: countdown, live totals, notices, schedule, emergency contacts, recent gallery items, shareable update.
- [x] Community: committee directory, notices, volunteers.
- [x] Money: donations, expenses, UPI QR, receipts, assets, reusable inventory, bidding and winning bid donation trigger.
- [x] Schedule: upcoming/live/past groups, sponsors, Google Calendar link, IST `.ics` with 30-minute alarm.
- [x] Recognition: awards and one-vote-per-session Best Pandal poll.
- [x] Memories: compressed image upload, links, YouTube embed, year grouping, lightbox.
- [x] Help: server-side Claude proxy; API key is not sent to the browser.
- [ ] Compare all visual wording and interaction details against the missing original prototype HTML before public release.

## 3. Phase 2 — authenticated roles

- [x] Phone OTP login UI.
- [x] Invite-only account provisioning endpoint.
- [x] Viewer, Treasurer and Committee roles.
- [x] RLS policies enforce the role boundary in Postgres.
- [ ] Enable Phone Auth and configure an SMS provider in Supabase.
- [ ] Bootstrap the first Committee phone number using the commented SQL in the Phase 2 migration.
- [ ] Test with three real test accounts: Viewer, Treasurer and Committee.

## 4. Phase 3 — event reminders

- [x] Browser opt-in control, service worker, and server-side subscription storage.
- [x] Scheduled Vercel endpoint checks activities using explicit IST (`+05:30`).
- [x] Sends only once per activity/subscription and removes stale subscriptions.
- [ ] Generate VAPID keys and set `VITE_VAPID_PUBLIC_KEY`, `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`, and `CRON_SECRET`.
- [ ] Deploy and test a timed activity scheduled 30 minutes ahead on Android Chrome.
- [ ] Confirm Vercel Cron availability for the selected Vercel plan.

## 5. Phase 4 — localization

- [x] Locale persistence and selector component.
- [x] English catalogue and Telugu/Hindi review catalogues added.
- [ ] Have native Telugu and Hindi speakers review every static label and error message.
- [ ] Complete translation of remaining static feature text, not user-entered content.
- [ ] Only then enable `VITE_ENABLE_REVIEWED_LOCALES=true` for production.

## Suggestions for a later release

1. Add audit logging: record who added, edited, or deleted financial records.
2. Add a simple annual export/backup archive and automatic scheduled backup.
3. Add image metadata stripping and a storage-usage dashboard.
4. Add form-level validation and success/error toasts instead of browser alerts.
5. Add Playwright tests for public, Treasurer, and Committee flows.
6. Add monitoring for failed reminder sends and Claude API errors.
7. Review the original prototype HTML when supplied, especially exact labels and empty-state copy.
8. Consider the approved future backlog only after committee confirmation: lost and found, visarjan logistics, cultural sign-ups, vendors, trends, feedback.
