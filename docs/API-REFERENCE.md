# API Reference

> SDK methods used across 3 files

## Data API (`app.data.*`)

| Method | Used In |
|--------|---------|
| `app.data.list` | `src/hooks/useCompletions.ts`, `src/hooks/useHabits.ts` |
| `app.data.delete` | `src/hooks/useCompletions.ts`, `src/hooks/useHabits.ts` |
| `app.data.create` | `src/hooks/useCompletions.ts`, `src/hooks/useHabits.ts` |

## Auth API (`app.auth.*`)

| Method | Used In |
|--------|---------|
| `app.auth.getCurrentUser` | `src/hooks/useAuth.ts` |
| `app.auth.signUp` | `src/hooks/useAuth.ts` |
| `app.auth.signIn` | `src/hooks/useAuth.ts` |
| `app.auth.signOut` | `src/hooks/useAuth.ts` |

## Real-Time Subscriptions (`app.data.subscribe`)

| Method | Used In |
|--------|---------|
| `app.data.subscribe` | `src/hooks/useCompletions.ts`, `src/hooks/useHabits.ts` |
