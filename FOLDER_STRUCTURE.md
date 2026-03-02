BUCURA AI

## STARTP FOLDER STRUCTURE
===================================


Tech stack:

* **Next.js (App Router)**
* **TypeScript**
* **Supabase**
* **Groq API**
* Scalable architecture

---

# 📁 BUCURA AI – Recommended Folder Structure

```
bucura-ai/
│
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   ├── globals.css
│   │
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx
│   │   ├── register/
│   │   │   └── page.tsx
│   │   └── layout.tsx
│   │
│   ├── dashboard/
│   │   ├── page.tsx
│   │   └── layout.tsx
│   │
│   ├── chat/
│   │   └── [id]/
│   │       └── page.tsx
│   │
│   └── api/
│       ├── chat/
│       │   └── route.ts
│       ├── conversations/
│       │   └── route.ts
│       └── usage/
│           └── route.ts
│
├── components/
│   ├── ui/
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Card.tsx
│   │   └── Modal.tsx
│   │
│   ├── chat/
│   │   ├── ChatWindow.tsx
│   │   ├── MessageBubble.tsx
│   │   ├── ModeSelector.tsx
│   │   └── ChatInput.tsx
│   │
│   └── layout/
│       ├── Navbar.tsx
│       └── Sidebar.tsx
│
├── lib/
│   ├── ai.ts
│   ├── prompts.ts
│   ├── supabase.ts
│   ├── auth.ts
│   ├── usage.ts
│   └── utils.ts
│
├── services/
│   ├── conversation.service.ts
│   ├── message.service.ts
│   └── usage.service.ts
│
├── types/
│   ├── conversation.ts
│   ├── message.ts
│   └── user.ts
│
├── hooks/
│   ├── useAuth.ts
│   ├── useChat.ts
│   └── useUsageLimit.ts
│
├── middleware.ts
│
├── public/
│   ├── logo.png
│   └── favicon.ico
│
├── styles/
│   └── animations.css
│
├── .env.local
├── next.config.js
├── tsconfig.json
└── package.json
```

---

# 🔍 What Each Folder Does

---

## 📁 app/

Main routing system (Next.js App Router).

* `layout.tsx` → Global layout wrapper.
* `page.tsx` → Landing page.
* `auth` → Grouped authentication routes.
* `dashboard/` → User dashboard (conversations list).
* `chat/[id]/` → Dynamic chat page.
* `api/` → Backend API routes (server logic).

This keeps frontend + backend in one project.

---

## 📁 components/

Reusable UI components.

### ui/

Generic design components:

* Buttons
* Inputs
* Cards
* Modals

### chat/

Chat-specific components:

* Chat window
* Message bubbles
* Mode selector
* Input area

### layout/

App structure components:

* Navbar
* Sidebar

---

## 📁 lib/

Core logic utilities (IMPORTANT).

* `ai.ts` → Groq integration + model logic
* `prompts.ts` → Centralized system prompts
* `supabase.ts` → Supabase client setup
* `auth.ts` → Auth helpers
* `usage.ts` → Token tracking logic
* `utils.ts` → Generic helpers

This is your brain layer.

---

## 📁 services/

Business logic layer.

Separates database logic from API routes.

Example:

* conversation.service.ts → create/get conversations
* message.service.ts → store messages
* usage.service.ts → update usage

Keeps API routes thin and clean.

---

## 📁 types/

TypeScript interfaces.

* Conversation types
* Message types
* User types

Prevents bugs and keeps code clean.

---

## 📁 hooks/

Custom React hooks.

* useAuth → manage user state
* useChat → handle chat logic
* useUsageLimit → enforce daily limits

Makes frontend modular.

---

## 📁 middleware.ts

Protects routes.

* Prevents unauthenticated access to dashboard
* Redirects to login if not logged in

---

## 📁 public/

Static files.

---

## 📁 styles/

Optional extra styles beyond Tailwind.

---

# 🧠 Important Architectural Decisions

1. AI logic lives ONLY in `lib/ai.ts`
2. Prompts live ONLY in `lib/prompts.ts`
3. API routes call services, not database directly
4. Frontend never talks directly to Groq
5. Everything is typed

This keeps it scalable.

---

# 🧨 Why This Structure Matters

If BUCURA AI grows:

* You can swap Groq for Gemini API easily
* You can add subscription logic
* You can add PDF processing
* You can move to microservices later

Without rewriting everything.