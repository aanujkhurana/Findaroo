# 🎨 Findaroo UI Style Guide

A visual identity and design system for **Findaroo** — a crowdsourced lost & found return network.

Our goal is to be **trusted, approachable, and clean**. The design language balances **playfulness** (human feel), **professionalism** (safety, reputation), and **minimalism** (clarity and focus).

---

## 🌈 Color Palette

| Purpose          | Color        | Usage                          |
|------------------|--------------|---------------------------------|
| Primary Blue     | `#3A8DFF`    | Buttons, highlights             |
| Secondary Orange | `#FFA930`    | Action accents, tags            |
| Success Green    | `#33C48D`    | Returned items, positive status |
| Error Red        | `#FF4C4C`    | Flags, errors                   |
| Neutral Gray     | `#F2F2F2`    | Backgrounds                     |
| Dark Gray        | `#2E2E2E`    | Text, icons, contrast areas     |

### Colors are slightly soft with a modern web-safe tone — avoid over-saturation.

---

## 🅰️ Typography

| Type        | Font             | Style                      |
|-------------|------------------|----------------------------|
| Headings    | `Manrope`        | Semi-bold, uppercase small |
| Body Text   | `Inter`          | Regular / Medium, readable |
| Numbers     | `Roboto Mono`    | Optional for data/Karma    |

- Font size hierarchy (mobile-first):
  - `text-xl` → Titles
  - `text-base` → Normal body
  - `text-sm` → Captions, metadata

---

## 📦 Components

### 🔘 Buttons

| Type       | Style                                 |
|------------|----------------------------------------|
| Primary    | Blue background, white text, rounded-xl |
| Secondary  | Outline with blue border and text     |
| Danger     | Red background or border              |
| Disabled   | Grayed with `opacity-50`, `cursor-not-allowed` |

Example (Tailwind):
```jsx
<Button className="bg-[#3A8DFF] text-white rounded-xl px-4 py-2 shadow-md active:scale-[0.98]" />
````

---

### 📄 Cards

* Rounded corners (`rounded-2xl`)
* Light shadows (`shadow-sm`)
* Padding (`p-4`)
* Simple layout: icon/image, text block, action

Use for:

* Item previews
* User reputation summary
* Item return callouts

---

### 🗺️ Maps

* Pin icons:

  * 🔴 Red → Lost item
  * 🟢 Green → Found item
  * ⚪ Grey → Returned/resolved
* Tooltip-style popups with title, category, quick contact

---

### 📷 Image Uploads

* Use square containers (`aspect-square`)
* Drag-and-drop or tap-to-upload (mobile)
* Preview with trash/delete overlay icon

---

### 🧱 Layout

| Area      | Pattern                             |
| --------- | ----------------------------------- |
| Home Feed | Scrollable list + map toggle tab    |
| Post Form | Stacked inputs with icons           |
| Chat      | Bubble UI (you = blue, them = gray) |
| Profile   | Card + stat summary                 |

* Mobile-first design
* Max 2-3 actions per screen
* Safe touch zones (at least `44x44px`)

---

## 📱 Microinteractions

* Button press → subtle bounce (`scale-[0.98]`)
* Success → green checkmark pulse
* New message → dot badge
* Image upload → fade-in preview
* Karma gain → animated confetti 💫 (optional)

---

## 🧪 Accessibility

* Minimum color contrast ratio: 4.5:1
* Support for dark mode (future toggle)
* Icons always paired with labels
* Forms use `aria-label` and semantic grouping

---

## 🏷️ Iconography

Use [Lucide Icons](https://lucide.dev/) or Feather:

* 🔍 Search
* 📍 Location pin
* 🧭 Compass (map toggle)
* 📦 Box/package (lost item)
* 💬 Chat bubble
* ✅ Checkmark
* 🚩 Flag
* 💎 Karma icon (star/diamond)

All icons in `24px`, stroke-based, `currentColor` fill.

---


## ✅ Design Principles

1. **Clarity over decoration**
   → Focus on what matters (Lost? Found? Where? Who?)

2. **Emotionally aware**
   → Use warm tones, human copywriting, emojis where meaningful

3. **Trust by design**
   → Verified badges, clean spacing, secure-feeling flows

4. **Playful yet minimal**
   → Subtle animations, gradients, not loud colors


## 🧠 Brand Voice (for UI Copy)

* Friendly & human
* Encouraging trust & honesty
* Short sentences, action verbs
* Emojis used thoughtfully, not everywhere

Example:

> “🎉 Someone found your item! Tap to chat and get it back.”

---

## 📍 Status Badge Design

| Status      | Color  | Badge Text           |
| ----------- | ------ | -------------------- |
| `lost`      | Red    | ❌ Lost               |
| `found`     | Green  | ✅ Found              |
| `returned`  | Gray   | 🏁 Returned          |
| `kept`      | Orange | 🧤 Kept (unresolved) |
| `flagged`   | Red    | 🚩 Under Review      |
| `duplicate` | Gray   | 🔁 Duplicate         |
