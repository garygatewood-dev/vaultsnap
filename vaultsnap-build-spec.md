# VaultSnap — Build Spec for Claude Code

A polished private photo/video vault app, built on Gary's BoardArmor stack (React + Netlify + Supabase + Stripe + Resend), cloning the proven monetization pattern of Private Photo Vault ($600K/mo on ~80K downloads/mo).

## Strategic call: web app, not native

Private Photo Vault is a native iOS/Android app monetized through App Store IAP. Gary's stack is a web stack. Rather than fight that, build VaultSnap as a **PWA (installable web app)** with **Stripe Checkout** for billing instead of App Store IAP:

- No 30% Apple/Google cut, no App Review delays, ship and iterate same-day.
- Modern mobile browsers support "Add to Home Screen" + WebAuthn (biometric unlock via Face ID/Touch ID/Android biometrics through the platform authenticator), so the core UX (open app, unlock with Face ID) is achievable without native code.
- Trade-off: no App Store search discovery. Go-to-market has to be direct (ads, content, SEO) rather than App Store browse traffic. Worth deciding explicitly before building — flag to Gary if App Store presence turns out to matter for this niche.
- Path to native later: same React codebase can be wrapped with Capacitor for an actual App Store listing if the web version validates demand. Don't build that in v1.

## Core feature set (mirrors the proven funnel)

1. **Account layer**: Supabase Auth (email/password or magic link) — this is just "who owns this data," separate from the vault lock.
2. **Vault lock screen**: PIN setup on first use, WebAuthn biometric unlock where supported, PIN fallback everywhere else. This screen gates the actual photo content every time the app opens or backgrounds.
3. **Import & gallery**: upload photos/videos, thumbnail grid, albums/folders, search, favorites, delete.
4. **Private storage**: Supabase Storage, one private bucket per user, RLS-scoped, accessed only via short-lived signed URLs. (True end-to-end/zero-knowledge encryption — where even Gary's own backend can't read the photos — is a stronger privacy claim but meaningfully more build effort; treat it as a v2 differentiator, not a v1 requirement. v1 promise is "private and access-controlled," not "we cannot see it.")
5. **Break-in alerts**: on a failed unlock attempt, silently capture a photo via the device camera and email/notify the account owner. This is a well-known feature (Keepsafe/Private Photo Vault use it) that drives free-to-paid upgrades — people who see "someone tried to open your vault" convert fast.
6. **Free tier cap**: e.g., 25 photos free. Genuinely useful, but creates real upgrade pressure once hit.
7. **Trial → subscription paywall**: 2-day free trial into an annual plan. Anchor a monthly price higher (~$6.99/mo) next to the annual price (~$34.99–$39.99/yr) so annual reads as the deal — this is the exact pattern both PictureThis and Private Photo Vault use. Paywall shown at two points: once after the user has imported something (seen value), once when they hit the free-tier cap.
8. **Optional differentiator, post-launch**: a decoy/disguise mode (app icon or alternate PIN opens a fake empty vault) — a frequently-requested feature in this category that's a good "our spin" candidate once the core is live.

## Data model (Supabase)

- `photos`: id, user_id, storage_path, thumbnail_path, album_id, is_favorite, created_at
- `albums`: id, user_id, name, created_at
- `subscriptions`: id, user_id, stripe_customer_id, stripe_subscription_id, status, current_period_end
- `break_in_attempts`: id, user_id, photo_storage_path, attempted_at
- `vault_pins`: id, user_id, pin_hash, webauthn_credential_id

Every table: RLS policy restricting to `auth.uid() = user_id`, plus `GRANT ALL ... TO service_role` per Gary's standard gotcha — don't skip this, service role calls fail silently (empty results, not errors) without it.

## Netlify Functions needed

- `create-checkout.js` — Stripe Checkout session, subscription mode, 2-day trial
- `stripe-webhook.js` — raw body verification, updates `subscriptions` table on checkout/renewal/cancel
- `generate-upload-url.js` — signed Supabase Storage upload URL, scoped to the requesting user
- `break-in-alert.js` — receives the failed-unlock photo, stores it, triggers a Resend email to the account owner

## Emails (Resend)

- Welcome / verify email
- Break-in alert ("Someone tried to open your vault") — this one matters most for conversion
- Trial-ending reminder (recapture before churn)

## Build order for Claude Code (do NOT hand this all over at once — go phase by phase, review after each)

1. Scaffold: Vite + React repo under `garygatewood-dev/vaultsnap`, connect Netlify, create Supabase project, run schema SQL, apply the `GRANT ALL` statements.
2. Auth + app shell: Supabase Auth, basic routing, empty vault screen behind login.
3. Vault core: upload, signed URLs, gallery grid, albums, delete, favorites, search.
4. Lock screen: PIN setup/verify, WebAuthn biometric registration + challenge flow, session timeout re-lock.
5. Stripe billing: products/prices in live mode, checkout function, webhook, free-tier cap enforcement, hard paywall check on protected actions.
6. Resend: welcome, break-in alert, trial-ending emails.
7. Break-in alert feature end-to-end (camera capture on failed PIN/biometric attempt → upload → email).
8. Polish: decoy mode, onboarding flow that shows value before the first paywall, empty states, loading states.
9. Full QA pass: signup → onboarding → import → hit free cap → trial → subscribe → renew/cancel webhook — test every step live before launch.
10. Custom domain, Stripe live mode confirmed, go live.

## Required env vars (Netlify dashboard, never committed)

`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `RESEND_API_KEY`

## One product-risk note worth flagging to Gary directly

This app's entire pitch is "your private photos are safe here." That makes the privacy policy, breach-response posture, and honesty about what "private" actually means (access-controlled vs. true encryption) a real trust issue, not boilerplate — worth writing a real privacy policy page before launch, not a placeholder.
