# Simple Habit Tracker App — Vibexe App

## Platform
This app runs on **Vibexe** (https://vibexe.online), a no-code/low-code app builder.
All files are React/TypeScript rendered in a Sandpack browser environment.
App ID: `bldr_fcjZ7dIk2Ahq3xsZbHJhW`

## SDK
```typescript
import { VibexeSDK } from "./vibexe-sdk";
const app = new VibexeSDK({ appId: "bldr_fcjZ7dIk2Ahq3xsZbHJhW" });
```

### Data API
```typescript
// List with pagination, filtering, sorting
const result = await app.data.list("entity", {
  filter: { status: "active" },    // "filter" (singular), NOT "filters"
  sort: "created_at",              // field name string
  order: "desc",                   // "asc" | "desc"
  page: 1,                        // 1-indexed
  limit: 50,
  search: "query",                // full-text search
  include: ["relation"],          // populate relations
});
// result = { data: Item[], pagination: { page, limit, total, totalPages } }

// Filter operators
const result = await app.data.list("products", {
  filter: {
    price: { gte: 10, lte: 100 },       // range
    status: { in: ["active", "sale"] },  // set membership
    name: { like: "Pro%" },              // ILIKE pattern
    stock: { gt: 0 },                    // comparison
  },
});

// CRUD
await app.data.get("entity", id);
await app.data.get("entity", id, { include: ["relation"] });
await app.data.create("entity", { field: "value" });
await app.data.update("entity", id, { field: "newValue" });
await app.data.delete("entity", id);

// Nested create (parent + children in one transaction)
await app.data.create("orders", {
  customer: "John",
  order_items: [{ product: "A", qty: 2 }],  // child entity table name
});

// Reverse relations
await app.data.listRelated("posts", postId, "comments", { limit: 50 });
await app.data.createRelated("posts", postId, "comments", { text: "Great!" });

// Real-time subscriptions (SSE)
const unsub = app.data.subscribe("tasks", (event) => {
  // event = { type: "created"|"updated"|"deleted", data: {...} }
});
unsub(); // cleanup
```

### Auth API
```typescript
await app.auth.signUp(email, password, name?);  // Register user
await app.auth.signIn(email, password);          // Login
await app.auth.signOut();                        // Logout
const user = await app.auth.getUser();           // Current user (null if not logged in)
```

### Storage API
```typescript
const { path, url } = await app.storage.upload(file);  // Upload File object
const files = await app.storage.list(prefix?);          // List files
await app.storage.delete(path);                         // Delete file
const url = app.storage.getUrl(path, transforms?);      // Get URL
// transforms: { width?, height?, format?, quality? }
```

### Backend Functions
```typescript
const result = await app.functions.invoke("functionName", data);
```

### Jobs
```typescript
await app.jobs.create({ name, cronExpression, functionName });
```

## Data Model
### Habit (table: `habits`)
Fields (id, created_at, updated_at are auto-added):
  - `name`: text (required)
  - `color`: text
  - `user_id`: text (required)

### HabitCompletion (table: `habit_completions`)
Fields (id, created_at, updated_at are auto-added):
  - `habit_id`: relation (required) → Habit
  - `completed_date`: date (required)
  - `user_id`: text (required)

## File Structure
- `App.tsx` — Root component (entry point, default export)
- `vibexe-sdk.ts` — SDK file (auto-injected, do not modify)
- All other `.tsx`/`.ts` files — Components and utilities

## Rules
1. **NEVER** modify `vibexe-sdk.ts` — it is auto-injected by the platform
2. All data operations **MUST** use the SDK (`app.data.*`, `app.auth.*`, etc.)
3. Use **Tailwind CSS** classes for styling (available in runtime)
4. **React 18+** with hooks — no class components
5. Entry point is `App.tsx` default export
6. Do not use `fetch()` for data — always use the SDK methods
7. The `.vibexe/` directory contains platform config — do not modify

## Syncing Changes
After making changes, commit and push to this branch.
Then go to the Vibexe App Builder and click **Pull** to sync changes back.
