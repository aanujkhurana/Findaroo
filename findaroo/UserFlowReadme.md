## 🧭 **Findaroo User Flow (Start to Finish)**
┌────────────────────┐
│ 1. App Launch      │
└────────┬───────────┘
         │
         ▼
┌────────────────────┐
│ 2. Onboarding      │
│  - Welcome Screen  │
│  - Login / Signup  │
└────────┬───────────┘
         │
         ▼
┌──────────────────────────────┐
│ 3. Home / Feed               │
│  - Map View (lost/found pins)│
│  - List View                 │
│  - Filters: Lost/Found, Cats│
│  - Search bar (keywords)    │
└────────┬─────────────┬──────┘
         │             │
         ▼             ▼
┌────────────────┐   ┌───────────────────┐
│ 4a. Post Lost   │   │ 4b. Post Found    │
│  - Title        │   │  - Title          │
│  - Description  │   │  - Description    │
│  - Category     │   │  - Category       │
│  - Image Upload │   │  - Image Upload   │
│  - Location     │   │  - Location       │
│  - Optional tip │   │                   │
└──────┬──────────┘   └─────────┬─────────┘
       │                        │
       ▼                        ▼
┌────────────────────────────┐
│ 5. Item Posted             │
│  - Visible on feed/map     │
│  - Viewable by others      │
└──────────┬─────────────────┘
           │
           ▼
┌────────────────────────────┐
│ 6. Item Details Screen     │
│  - Item info               │
│  - Image + location        │
│  - Message Finder/Loser →  │
└──────────┬─────────────────┘
           │
           ▼
┌────────────────────────────┐
│ 7. Chat Screen             │
│  - Realtime messaging      │
│  - Item context attached   │
└──────────┬─────────────────┘
           │
           ▼
┌────────────────────────────┐
│ 8. Return & Resolution     │
│  - Mark item as returned   │
│  - Tip optional ($ via Stripe)│
│  - Earn karma points       │
└──────────┬─────────────────┘
           │
           ▼
┌────────────────────────────┐
│ 9. Profile Screen          │
│  - View own posts          │
│  - Karma score             │
│  - Edit profile pic/info   │
└──────────┬─────────────────┘
           │
           ▼
┌────────────────────────────┐
│ 10. Logout / Settings      │
└────────────────────────────┘

## 💡 Notes on Flow

* Users **don’t need to pay** to post or respond — it’s community-first.
* Every lost/found post includes **category, geolocation, and image**.
* Real-time chat is tied to an `item_id` and exists only between 2 users.
* You can **track karma** as a reputation system.
* Users can **offer a tip** to encourage faster return.

## 🧾 1. 📦 Item Lifecycle & Status Flow

Each item post has a `status` and `resolved` boolean:

| Status      | Who can set?         | Description                                      |
| ----------- | -------------------- | ------------------------------------------------ |
| `lost`      | Poster (user)        | User reports they lost an item                   |
| `found`     | Finder (user)        | User found an item                               |
| `claimed`   | Finder (manual/auto) | Finder marks it claimed by someone               |
| `returned`  | Finder or poster     | Item has been successfully returned              |
| `kept`      | Finder (edge case)   | Finder decides to keep item (warned/discouraged) |
| `flagged`   | Admin/moderator      | Item post is spam/inappropriate                  |
| `duplicate` | Auto/moderator       | Duplicate of existing post                       |
| `resolved`  | System/Poster        | Boolean: whether item is no longer active        |

### 🔁 State Transitions

```text
lost ─┬─▶ returned
      ├─▶ resolved (manually closed)
      └─▶ duplicate / flagged

found ─┬─▶ claimed (someone matched)
       ├─▶ returned
       ├─▶ kept (edge case)
       └─▶ flagged / duplicate
```

* Once `returned`, `resolved` is auto-set to `true`.

---

## 🧪 2. Edge Cases & How Findaroo Handles Them

| Edge Case                              | Solution                                                                             |
| -------------------------------------- | ------------------------------------------------------------------------------------ |
| User posts spam item                   | Allow community to flag. Auto-hide after 3+ reports. Admin override.                 |
| Two users claim the same lost item     | Use timestamp + chat logs. Allow both to chat, one to claim, other flagged as dupe.  |
| Finder keeps item instead of returning | Allow status to be set as `kept` but with warning. Negative karma. Option to report. |
| Item is posted both as found and lost  | Fuzzy match titles/descriptions. Show related items below post. Suggest auto-match.  |
| User ghosting messages                 | Add “Mark as unresponsive” after 48hrs. Gives karma warning.                         |
| Wrong user claims item                 | Allow finder to reject/mark item as mismatch. Both parties can close claim.          |

---

## 💰 3. How Payments Work (Tips / Bounties)

### Use Case: Lost item has reward (\$10–\$25)

* **Step 1**: Poster enters optional reward amount on post (saved in `reward_amount`)
* **Step 2**: If item is returned → "Send Thank-You Tip" button is shown
* **Step 3**: Poster can confirm return and pay via **Stripe Checkout / Connect**

### Supabase Tables Used

| Table  | Field                                                         |
| ------ | ------------------------------------------------------------- |
| `tips` | sender\_id, receiver\_id, amount, status, payment\_intent\_id |

### Stripe Setup Options:

* Use [Stripe Connect](https://stripe.com/connect) to pay returners
* Or simpler: Send tips to Findaroo, which forwards funds periodically (if you don’t want to manage tax KYC yet)

> 💡 MVP Suggestion: Keep it as **thank-you tip** (not “payment”) to avoid liability. Add note: "optional tip to appreciate your returner."

---

## 🙋 4. User Roles & Trust

| Role               | Powers                               |
| ------------------ | ------------------------------------ |
| Regular user       | Post lost/found, chat, mark returned |
| Returner           | Same, with optional karma boosting   |
| Trusted Returner ✅ | Users with 3+ returns + ID verified  |
| Admin              | Remove posts, reset statuses, ban    |
| Moderator (future) | Community-based flag reviewers       |

---

## 💎 5. Karma System

Each action earns or loses **karma points**, stored in `karma_events`.

| Action                         | Points |
| ------------------------------ | ------ |
| Return successful item         | +10    |
| Sends thank-you tip            | +5     |
| Ghosts return request          | -5     |
| Keeps item without responding  | -10    |
| Gets flagged by other users    | -3     |
| Reports spam/fake (accurately) | +1     |

> Karma score shown on profile. Can unlock badges later.

---

## 🧩 Flow Example (Full)

1. John loses wallet → posts `status = 'lost'`, adds reward \$15
2. Sara finds wallet → posts `status = 'found'`, sees matching lost post
3. Chat opens → Sara & John agree → Sara hands it over
4. John clicks "Mark as returned" + sends \$15 thank-you tip
5. Both earn karma, post is now `status = 'returned'`, `resolved = true`
6. System adds both to “Trusted Finder” list after 3+ similar events
