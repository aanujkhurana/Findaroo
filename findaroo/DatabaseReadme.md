# 📚 Findaroo Database Schema – Supabase (PostgreSQL + RLS)

This document outlines the entire backend schema for **Findaroo**, including table structures, field types, relationships, edge cases, and Supabase-specific rules like storage and RLS.

---

## 🧱 Entity Overview

| Table              | Description                               |
|--------------------|-------------------------------------------|
| `users`            | Registered users                          |
| `items`            | Lost/found item listings                  |
| `messages`         | Realtime chat tied to an item             |
| `karma_events`     | Logs reputation activity                  |
| `tips`             | Optional thank-you payments               |
| `item_categories`  | Predefined dropdowns for item types       |
| `storage.objects`  | Supabase-managed files (images)           |

---

## 👤 Table: `users`

| Field        | Type         | Notes                        |
|--------------|--------------|------------------------------|
| id           | UUID (PK)    | Matches Supabase Auth UID    |
| full_name    | TEXT         |                              |
| email        | TEXT         |                              |
| profile_pic  | TEXT         | Supabase Storage path        |
| phone        | TEXT         | Optional                     |
| karma_points | INTEGER      | Calculated from `karma_events` |
| created_at   | TIMESTAMP    | Default = now()              |

---

## 📦 Table: `items`

| Field         | Type                  | Notes                                  |
|---------------|-----------------------|----------------------------------------|
| id            | UUID (PK)             | Auto-generated                         |
| user_id       | UUID (FK → users.id)  | Poster of the item                     |
| status        | TEXT                  | Enum: `lost`, `found`, `returned`, `kept`, `claimed`, `flagged`, `duplicate` |
| resolved      | BOOLEAN               | True when item flow is complete        |
| category      | TEXT                  | FK (or free text)                      |
| title         | TEXT                  |                                        |
| description   | TEXT                  |                                        |
| image         | TEXT                  | Storage path (e.g. `userId/image.jpg`) |
| location      | GEOGRAPHY(POINT)      | For geo search, via PostGIS            |
| location_name | TEXT                  | Human-readable e.g. "Gold Coast Mall"  |
| reward_amount | NUMERIC               | Optional tip amount ($AUD)             |
| created_at    | TIMESTAMP             | Default = now()                        |

🔁 **State Logic**

lost → returned | resolved | duplicate | flagged
found → returned | claimed | kept | duplicate | flagged

## 💬 Table: `messages`

| Field        | Type                 | Notes        |
| ------------ | -------------------- | ------------ |
| id           | UUID (PK)            |              |
| item\_id     | UUID (FK → items.id) |              |
| sender\_id   | UUID (FK → users.id) |              |
| receiver\_id | UUID (FK → users.id) |              |
| message      | TEXT                 | Message text |
| sent\_at     | TIMESTAMP            |              |

🧠 1-on-1 chat is scoped to a specific `item_id`. A single item may create multiple threads (future: enforce unique pair).

---

## 🧲 Table: `karma_events`

| Field       | Type                 | Notes                                        |
| ----------- | -------------------- | -------------------------------------------- |
| id          | UUID (PK)            |                                              |
| user\_id    | UUID (FK → users.id) |                                              |
| item\_id    | UUID (FK → items.id) | Optional                                     |
| action      | TEXT                 | `return_success`, `ghosted`, `flagged`, etc. |
| points      | INTEGER              | Positive or negative                         |
| created\_at | TIMESTAMP            |                                              |

🧮 Karma is calculated by summing `points` grouped by `user_id`.

---

## 💰 Table: `tips`

| Field               | Type                 | Notes                            |
| ------------------- | -------------------- | -------------------------------- |
| id                  | UUID (PK)            |                                  |
| item\_id            | UUID (FK → items.id) |                                  |
| sender\_id          | UUID (FK → users.id) | Person giving the tip            |
| receiver\_id        | UUID (FK → users.id) | Person receiving the tip         |
| amount              | NUMERIC              | Tip amount                       |
| status              | TEXT                 | `pending`, `succeeded`, `failed` |
| payment\_intent\_id | TEXT                 | From Stripe                      |
| created\_at         | TIMESTAMP            |                                  |

Stripe payments are tied to item return flow. Status changes after webhook confirms.

---

## 📂 Supabase Storage Buckets

### `item-images` (for posted item photos)

* Upload path: `userId/filename.jpg`
* Policy: Only owner can `SELECT`, `INSERT`, `DELETE`

### `profile-pics` (user avatars)

* Same structure/policy

✅ All objects are **private**, with Row-Level Security enforced by user path matching:

```sql
-- RLS example
WITH CHECK (auth.uid() = split_part(name, '/', 1))
```

---

## 🔐 RLS Policies Summary

| Table             | RLS Enabled | Notes                              |
| ----------------- | ----------- | ---------------------------------- |
| `items`           | ✅           | Only poster can edit/delete        |
| `messages`        | ✅           | Only sender/receiver can read/send |
| `tips`            | ✅           | Only involved users can view       |
| `karma_events`    | ✅           | Only user can read their own karma |
| `storage.objects` | ✅           | Based on bucket path rules         |

---

## 🧩 Relationships

* `users.id` ←→ `items.user_id`, `messages.sender_id`, etc.
* `items.id` ←→ `messages.item_id`, `tips.item_id`
* `users.id` ←→ `tips.sender_id`, `receiver_id`
* `users.id` ←→ `karma_events.user_id`

📄 View visual ERD: `/docs/dropmate_erd_full.png`

---

## ⚠️ Edge Case Coverage

| Scenario                      | Resolution                                    |
| ----------------------------- | --------------------------------------------- |
| Same item posted twice        | Status: `duplicate`, hidden from feed         |
| Finder refuses to return item | Status: `kept`, karma penalty                 |
| Ghosting in chat              | Trigger `karma_event: ghosted`, report option |
| Inappropriate item post       | Status: `flagged`, hidden, report to admin    |
| Wrong person claims item      | Allow finder to reject match in chat          |
| Reward not paid               | Tip screen remains visible post-return        |


## 📌 Suggested Indexes

```sql
-- Speed up geo queries
CREATE INDEX idx_items_location ON items USING GIST(location);

-- For filtering/sorting
CREATE INDEX idx_items_status ON items(status);
CREATE INDEX idx_items_user_id ON items(user_id);
```

## ✅ Final Notes

* All IDs are UUIDs, except `item_categories` which can be SERIAL.
* Timestamps default to `now()` via Supabase UI or SQL.
* Geolocation is stored using `GEOGRAPHY(POINT)` (PostGIS must be enabled).
* All file uploads follow `userId/filename` pattern.

We can now proceed to full frontend integration 🔧