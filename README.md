
# 📘 BUCURA AI – Student-Focused AI Assistant

**Version:** MVP v1
**Tech Stack:** Next.js + TypeScript + Groq API + Supabase
**Goal:** Build a concise, student-focused AI assistant optimized for summaries and multiple-choice precision.

---

# 1. 🎯 Product Vision

BUCURA AI is a web-based (to be turned into progressive web app) genarative AI assistant designed primarily for local use (Rwanda) for students, teachers, or other professions


# 2. 👥 Target Users

* University students
* High school students
* Self-learners
* Users needing concise AI responses

---

# 3. 🧠 Core Features (MVP)

## 3.1 Chat Interface

* Real-time AI chat
* Message history
* Conversation persistence
* Streaming responses (if supported by Groq)

---

## 3.2 Modes System

Users can switch between:

### ✏️ Exam Mode

* Short answers only
* MCQ → return only correct letter + 1-line reason
* No long explanations

### 📚 Explanation Mode

* Clear structured explanation
* Bullet points
* Moderate detail

### 📄 Summary Mode

* Summarize text or pasted notes
* Output: bullet summary
* Optional: ultra-short summary (3–5 lines)

---

## 3.3 PDF / Text Summarization (Phase 2)

* Upload PDF
* Extract text
* Summarize
* Generate revision questions

---

# 4. 🖥️ User Interaction Flow

## 4.1 Authentication

* Email + password (Supabase Auth)
* Optional: Google login

---

## 4.2 Chat Flow

1. User selects mode
2. User sends message
3. Backend:

   * Wraps message in structured system prompt
   * Sends to Groq API
   * Applies formatting control
4. Response stored in database
5. Response returned to frontend

---

# 5. 🧩 System Architecture

```
Frontend (Next.js)
      ↓
API Route (/api/chat)
      ↓
AI Service Layer (lib/ai.ts)
      ↓
Groq API
      ↓
Response Processing Layer
      ↓
Database (Supabase)
```

---

# 6. 🗄 Database Structure (Detailed in app/database/schema.sql)



---

# 7. 🤖 Groq API Integration

## 7.1 Recommended Models (Initial Research)

* `llama3-8b-8192`
* `mixtral-8x7b`
* Other free-tier supported Groq models

---

## 7.2 AI Service Layer (lib/ai.ts)

Responsibilities:

* Choose model
* Inject system prompt
* Enforce max tokens
* Enforce concise output
* Return structured response

Example structure:

```ts
export async function generateResponse({
  userMessage,
  mode,
  conversationHistory
}) {
  const systemPrompt = buildSystemPrompt(mode)

  const response = await groq.chat.completions.create({
    model: "llama3-8b-8192",
    messages: [
      { role: "system", content: systemPrompt },
      ...conversationHistory,
      { role: "user", content: userMessage }
    ],
    max_tokens: 500,
    temperature: 0.4
  })

  return formatResponse(response)
}
```

---

# 8. 🎛 Prompt Engineering Strategy

## 8.1 Base System Prompt

```
You are BUCURA AI, a student AI assistant.

Rules:
- Stay strictly on topic.
- Avoid unnecessary explanations.
- Be concise and structured.
- Use bullet points when explaining.
```

---

## 8.2 Study Mode Prompt Add-on

```
If the question is multiple choice:
- Return only the correct option letter.
- Provide one short sentence justification.
- Do not explain further.
```

---

## 8.3 Summary Mode Prompt Add-on

```
Summarize the text clearly.
Use bullet points.
Keep it short and academic.
```

---

# 9. 🔒 Cost & Token Control Strategy

* max_tokens limit (400–600)
* temperature ≤ 0.5
* limit user messages per day
* store token usage
* enforce free-tier caps

---

# 10. 🎨 Frontend Pages

## / (Landing Page)

* Hero
* What makes it different
* Call to action

## /dashboard

* Conversations list
* New chat button
* Mode selector

## /chat/[id]

* Chat UI
* Message history
* Streaming output

---

# 12. MVP Development Phases

## Phase 1

* Auth
* Chat UI
* Groq integration
* Mode-based prompts

## Phase 2

* Conversation persistence
* Token tracking
* Usage limits

## Phase 3

* image reader
* PDF summarizer
* Revision generator
* UI refinement

## Phase 4 Monetization & Improvement (Future Phase)

Free Tier:

* 20 messages per day
* No PDF upload

Pro Tier:

* Unlimited chat
* PDF summarization
* Priority model
* Revision question generator
---

# 13. ⚠️ Important Engineering Principles

* AI provider must be swappable
* Business logic must not live in frontend
* All prompts centralized in one file
* Track usage from day one
* Design for scale even if small now

---
