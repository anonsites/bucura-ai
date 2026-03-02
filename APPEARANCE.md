You want:

* Professional density
* Good typography hierarchy
* Emerald buttons
* Squada One font
* Light lavender chat background (#e2c9ff)
* Not “average looking”

Let’s fix this properly.

---

# 🔥 First — The Real Fix for “Screen Is Full”

You must always wrap content in a constrained container:

```tsx
<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
```

Without this, everything expands to full width → looks huge.

---

# 🎨 Professional Global CSS (globals.css)

This assumes:

* Tailwind CSS installed
* You’ll import Squada One from Google Fonts in layout.tsx

---

## 🔤 Step 1 — Import Squada One in `layout.tsx`

Add inside `<head>`:

```tsx
<link
  href="https://fonts.googleapis.com/css2?family=Squada+One&display=swap"
  rel="stylesheet"
/>
```

---

## 🎨 Step 2 — `app/globals.css`

Here is a professional baseline:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

/* =========================
   ROOT DESIGN TOKENS
========================= */

:root {
  --background: #ffffff;
  --foreground: #111827;
  --muted: #6b7280;
  --border: #e5e7eb;

  --emerald-primary: #059669;
  --emerald-hover: #047857;

  --chat-bg: #e2c9ff;
}

/* =========================
   GLOBAL RESET IMPROVEMENTS
========================= */

html {
  font-size: 16px;
  scroll-behavior: smooth;
}

body {
  background-color: var(--background);
  color: var(--foreground);
  font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI",
    Roboto, Helvetica, Arial, sans-serif;
  line-height: 1.6;
  text-rendering: optimizeLegibility;
}

/* =========================
   TYPOGRAPHY SYSTEM
========================= */

/* Headings use Squada One */
h1,
h2,
h3,
h4 {
  font-family: "Squada One", sans-serif;
  letter-spacing: 0.5px;
  line-height: 1.2;
}

h1 {
  font-size: 2.25rem;
}

h2 {
  font-size: 1.875rem;
}

h3 {
  font-size: 1.5rem;
}

/* Paragraph text optimized for readability */
p {
  font-size: 0.95rem;
  color: var(--foreground);
  line-height: 1.7;
}

/* Secondary text */
.text-muted {
  color: var(--muted);
  font-size: 0.875rem;
}

/* =========================
   PROFESSIONAL CARD STYLE
========================= */

.card {
  background: white;
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 1.25rem;
  transition: all 0.2s ease;
}

.card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.06);
}

/* =========================
   EMERALD BUTTON SYSTEM
========================= */

.btn-primary {
  background-color: var(--emerald-primary);
  color: white;
  padding: 0.6rem 1.2rem;
  border-radius: 9999px;
  font-weight: 500;
  font-size: 0.875rem;
  transition: all 0.2s ease;
}

.btn-primary:hover {
  background-color: var(--emerald-hover);
  transform: translateY(-1px);
}

.btn-primary:active {
  transform: translateY(0px);
}

/* =========================
   CHAT UI STYLING
========================= */

.chat-background {
  background-color: var(--chat-bg);
}

/* Assistant bubble */
.message-assistant {
  background: white;
  border-radius: 16px;
  padding: 0.75rem 1rem;
  max-width: 70%;
  font-size: 0.9rem;
  line-height: 1.6;
}

/* User bubble */
.message-user {
  background: var(--emerald-primary);
  color: white;
  border-radius: 16px;
  padding: 0.75rem 1rem;
  max-width: 70%;
  font-size: 0.9rem;
}

/* =========================
   PROFESSIONAL GRID SYSTEM
========================= */

/* For dashboard feed */
.feed-grid {
  display: grid;
  gap: 1.5rem;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
}

/* =========================
   IMAGE CONTROL
========================= */

img {
  max-width: 100%;
  height: auto;
  border-radius: 12px;
  object-fit: cover;
}

/* =========================
   SCROLLBAR POLISH
========================= */

::-webkit-scrollbar {
  width: 8px;
}

::-webkit-scrollbar-thumb {
  background: #d1d5db;
  border-radius: 10px;
}
```

---

# 💡 Why Your UI Looked “Huge”

You likely:

* Used `w-full` everywhere
* Didn’t use `max-w-7xl`
* Didn’t use grid auto-fill
* Used `text-lg` everywhere
* Used too much padding

Professional feeds use:

```
grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
```

This allows:

* 4–8 cards on desktop
* 2–3 on tablet
* 1 on mobile

Automatically.

---

# 🧠 Professional Density Rule

Good dashboards:

* 260px–300px card width
* 14px–16px paragraph text
* 24px section spacing
* 16px internal padding

Not giant padding everywhere.
