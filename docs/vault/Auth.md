# Auth

Back to [[Home]] · Tables in [[Database]] · Store in [[State]]

## Files
- `src/features/auth/screens/RegisterScreen.tsx`: form → OTP modal → create
- `src/store/authStore.ts`: `register`, `login`, `loginWithGoogle`, `logout`
- `src/services/auth/firebaseAuthService.ts`: Firebase email/password, `normalizeGmail`
- `src/services/auth/otpEmailService.ts`: 6-digit code via EmailJS (10 min, 5 attempts); public key only, no private key (it would ship in the web bundle); EmailJS "Use Private Key" must stay off
- `src/services/auth/googleAuth.ts`: Google sign-in
- `src/services/database/userRepository.ts`: local `users` (SQLite / web localStorage)

## Register flow
1. Validate form; only `@gmail.com` allowed (`normalizeGmail`).
2. `firebaseEmailRegistered(gmail)` (best-effort `fetchSignInMethodsForEmail`) → stop early.
3. Send OTP → user enters code → `verifyCode`.
4. `authStore.register` → `firebaseRegister` (authoritative) → `upsertLocalEmailUser`
   → `resetLocalUserData(id)` (wipes stale local household for that email) so the
   Setup Wizard always shows for a new account.

## Wizard vs Home
`RootNavigator`: household settings `null` → Setup Wizard, object → Main tabs.
Login/register/logout call `resetUserScopedStores()` (clears wizard draft, pantry,
family, plan, grocery in memory) so nothing leaks between accounts.

## Duplicate email rule
- **Firebase Auth is the source of truth.** The local DB is never used to block
  registration (it keeps stale rows after a Firebase user is deleted).
- One account per Gmail inbox: `canonicalGmail()` strips dots and `+tag`; new
  accounts are created in Firebase under that form, so `auth/email-already-in-use`
  also catches aliases.
- Login / password reset try the typed address, then the canonical one (accounts
  created before canonicalization keep working).
- With email-enumeration protection on (Firebase default), step 2 always returns
  false and the duplicate is caught at step 4 (after the OTP).

## Login
Firebase first; legacy local-only accounts fall back to `loginUser` (hashed password).
