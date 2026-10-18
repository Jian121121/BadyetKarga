# Conventions

Back to [[Home]]

- Function components + `StyleSheet.create` at file bottom.
- Theme tokens only: `colors`, `typography`, `spacing`, `radii` from `shared/theme`.
- Frosted chrome uses `GlassView` (`expo-blur`): cards, tab bar, dialogs, and the notification sheet. Screen background is `colors.background`. Primary buttons stay solid green.
- Icons: `MaterialIcons` from `@expo/vector-icons`.
- Dialogs: `notify` / confirm helpers in `shared/utils/confirm.ts` (not `Alert`). Centered sheets use a pixel width from the window (`Math.min(windowWidth - 48, …)`) so padding cannot push the card off the right edge.
- Errors: services throw `Error` with user-facing messages; stores put them in `error`.
- Platform split: `Platform.OS === 'web'` → localStorage mock, else SQLite.
- Secrets in `.env.local` as `EXPO_PUBLIC_*`; never commit or print them.
- Mermaid diagrams follow `.github/instructions/mermaid.instructions.md`.

## Branding
- Use `shared/components/BrandLogo`: `full` (bag + name artwork, alone), `mark` (bag only), `inline` (bag + name text).
- Never place `full` next to a "BadyetKarga" text label.
- Native splash: `expo-splash-screen` plugin in `app.json` with transparent `assets/splash-icon.png`.

