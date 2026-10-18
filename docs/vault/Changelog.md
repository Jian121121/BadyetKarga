# Changelog

Back to [[Home]] · One line per notable change, newest first.

- 2026-10-12: Login, profile, and the remaining centered sheets use a screen-fit width so they no longer clip on the right → [[Conventions]]
- 2026-10-12: Email verification code modal stays centered → [[Conventions]]
- 2026-10-12: Budget ring on Analytics starts at the top and fills toward the left → [[Conventions]]
- 2026-10-12: Planner fills days from the top Auto-Plan button; per-day Auto-Fill removed → [[Conventions]]
- 2026-10-12: Planner week strip, budget bar, and glass day cards; Auto-Plan opens as a sheet → [[Conventions]]
- 2026-10-12: Splash logo stays centered and scales with the screen → [[Conventions]]
- 2026-10-12: Glass chrome (`GlassView`) on cards, tab bar, inputs, dialogs, and the notification sheet; screen background shifted so the frost reads → [[Conventions]]
- 2026-10-10: Database ERD as one-page A4 portrait draw.io (`docs/database-erd.drawio`) → [[Database]]
- 2026-10-10: System flowchart as one-page A4 portrait draw.io (`docs/system-flowchart.drawio`) → [[Architecture]]
- 2026-10-10: Graphify project rule + code graph (`graphify-out/`); OmniRoute MCP in `.cursor/mcp.json`
- 2026-10-06: Notifications readable: titles wrap, time under body, darker body text, ₱ amounts with commas
- 2026-10-06: `EmptySlotPicker` uses the shared sheet style, grouped by day with meal chips → [[Conventions]]
- 2026-10-06: Add/Edit Dish: unit picker (no silent ingredient drops), "Total price" + per-unit hint, optional ingredients (priority low), Edit Dish, custom dishes per account (`getAllDishes(viewerId)`), duplicate-name warning, discard-changes guard → [[Database]], [[Conventions]]
- 2026-10-06: Groceries: ticks survive regenerate, partial trips, market sections, buyable amounts, remembered prices, share list, consistent budget card → [[Algorithms]], [[State]]
- 2026-10-06: Analytics fixes (honest money saved, local months, estimates excluded, planned vs actual, over-budget) + Buffer, Cost per Serving, Goal Progress, Estimated vs Actual cards → [[Algorithms]]
- 2026-10-06: `NotificationsModal` restyled to the shared sheet design (rounded rows, unread dot, Mark all read beside NEW) → [[Conventions]]
- 2026-10-06: Edit Household religion + dish-exception pickers use the wizard's sheet style (handle, subtitle, radio rows, rounded selection); wizard religion sheet shows descriptions → [[Conventions]]
- 2026-10-06: Visitor buffer is now its own contingency in the budget buffer (scaled by visitor share, +1–8 pts, cap 25%); buffer text mentions it → [[Algorithms]]
- 2026-10-06: In-app headers use `BrandLogo`; Other/Custom get a type box for any food to avoid (wizard, Edit Household, planner, dish screens); wizard summary shows food rules → [[Algorithms]]
- 2026-10-06: `BrandLogo` component + transparent `logo-full`/`logo-mark`; no duplicated name; splash via `expo-splash-screen` plugin → [[Conventions]]
- 2026-10-06: New accounts always get the Setup Wizard (stale local data wiped); pantry name matching, stock depletion, dedupe → [[Auth]], [[Algorithms]]
- 2026-10-06: Other/Custom religion → foods-to-avoid picker; Catholic Lent Fridays; visitors only lunch/dinner (fixed double count); stronger waste/trips/healthy scoring → [[Algorithms]]
- 2026-10-06: UI pass: modal back-button/keyboard fixes, safe-area insets, shared TextInput `style` fix, Home deep links keep tab history.
- 2026-10-06: Budget buffer now from `calculateBudgetBuffer()` only → [[Algorithms]], [[State]]
- 2026-10-06: Added token-manager rule (`.cursor/rules/token-manager.mdc`) and this vault.
- 2026-10-06: Block duplicate Gmail registration incl. dot/plus aliases → [[Auth]]
