# Project structure

```text
src/
  App.jsx                     # Application composition and portal screens
  components/
    ui.jsx                    # Card, button, form, empty state, toran
    PushNotifications.jsx     # Browser opt-in and subscription flow
    LanguageSelector.jsx      # Phase 4 locale switcher
  hooks/
    useAuth.js                # Legacy OTP hook retained for migration reference
    usePortal.js              # Portal reads and RLS-respecting mutations
  i18n/
    locales.js                # Reviewed/under-review language catalogue
  lib/
    supabase.js               # Supabase client configuration
api/
  ask.js                      # Server-side Claude proxy
  invite.js                   # Committee-only account invitation route
  push-subscribe.js           # Server-side subscription storage route
  reminders.js                # Vercel Cron push sender
supabase/migrations/
  20260820_phase1.sql         # Core portal tables
  20260824_phase2_auth.sql    # OTP accounts, invites and RLS roles
  20260824_phase3_push.sql    # Push subscriptions and delivery records
  20260825_music_playlist.sql # Supabase-backed festival playlist
  20260825_passcode_auth.sql  # Shared admin passcode functions and policies
public/sw.js                  # Service worker for Web Push
```

## Permission boundary

- Browser UI only determines which controls to show.
- The shared passcode is the pilot authorization boundary for the browser UI; Supabase RPCs verify and update it without exposing the stored value.
- Server routes use the service-role key only where a browser must never have that authority: storing push subscriptions and sending notifications.
- Never expose `SUPABASE_SERVICE_ROLE_KEY`, VAPID private key, `CRON_SECRET`, or `ANTHROPIC_API_KEY` through a `VITE_` environment variable.

## Release order

1. Apply migrations in filename order.
2. Run the passcode migration and create the first admin passcode from the portal.
3. Add the Vercel variables listed in `.env.example`.
4. Enable reviewed Phase 4 locales only after native-speaker approval of every static string.
