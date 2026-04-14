# Linbble — Product Requirements Document

## Overview

**Linbble** is a local-first desktop language learning app (Electron, Mac/Windows) powered by Ollama AI models. It helps Chinese users learn English through three integrated experiences: structured vocabulary learning, a proactive AI friend, and a general-purpose chat window.

All AI runs locally — no cloud, no subscription, full privacy.

**Current language support:** Chinese ↔ English
**Future:** Japanese, Spanish, French

---

## App Structure

Linbble is divided into three main sections, accessible from the sidebar:

| Section | Name | Purpose |
|---|---|---|
| 1 | **WordMix** | SRS vocabulary learning with sentence immersion |
| 2 | **Charley** | AI friend that proactively starts conversations |
| 3 | **Chat** | General-purpose AI chat (like ChatGPT) |

---

## Part 1 — WordMix

### Overview
WordMix is the core learning experience. The user sees AI-generated Chinese sentences with one English word embedded, rated the word, and builds vocabulary over time using spaced repetition.

### Features

#### Word Selection
- Words sourced from a CEFR-graded word bank (A1, A2, B1, B2, C1, ~7,000 words)
- User picks a level or selects "All"
- Word selection uses **weighted probability** — overdue words surface more often, dismissed words are excluded
- New (unstudied) words get a neutral weight of 0.5

#### Sentence Generation
- AI generates a natural Chinese sentence with the target English word embedded (code-switching style)
- Prompt enforces the English word must appear — no full-Chinese fallback
- User can request "Another Example" for a different sentence on the same word

#### Rating System
After reading the sentence, the user rates the word:
- **"I want to see this word"** — review in 4 hours (still learning)
- **"I may want to see this word in the future"** — 2 days first time, grows gradually
- **"I don't want to see this word in the future"** — 180 days, excluded from Story Mode

All nav buttons (Next Word, Story Mode, Change Level) are locked until the user rates.

#### Word Actions
Each word supports three additional actions:
- **Another Example** — new sentence for the same word, resets rating
- **Explain More** — detailed explanation of meaning, usage, collocations (in Chinese)
- **Word Roots** — natural paragraph on prefix, root, suffix, and related words (in Chinese)

#### Story Mode
- Requires at least 5 studied words
- AI generates a coherent 3–5 sentence Chinese paragraph using 5 studied words in English
- Word selection is weighted — overdue words appear more often, dismissed words excluded
- Each English word appears exactly once
- Unlocks after 5 words have been rated at least once

#### Word Highlighting
- After AI responds, English words that exist in the word bank are underlined (dotted, primary color)
- Clicking a word opens an inline panel showing:
  - Translation
  - Explain More
  - Another Example
  - Word Roots
- Only one panel open at a time; clicking the same word closes it

#### Review Queue
- Words rated "I want to see this word" come back in 4 hours
- Words due for review appear in a Review button with count
- Review picks randomly from all due words

#### Progress Tracking
- Stats bar: total learned, streak (days), due count
- Progress saved locally via Electron IPC
- SRS data: interval, ease factor, review count, next review date, dismissed flag

#### Navigation
- **Change Level** — go back to level picker (saves current word state, Back button restores it)
- **← Back** — restore previous word and phase
- **Next Word →** — pick next word using weighted selection
- **Clear History** — wipes the WordMix conversation history

---

## Part 2 — Charley (AI Friend)

### Overview
Charley is a proactive AI friend who comes online at random times during the day and initiates English conversations with the user. The goal is natural, low-pressure English practice that feels like messaging a real friend — not a language drill.

### Character
- **Name:** Charley
- **Personality:** Friendly, casual, curious — like a 25-year-old native English-speaking friend
- **Language:** English only (forces the user to practice)
- **Memory:** No persistent memory across sessions (local model limitation) — each online window starts fresh
- **Word awareness:** Charley knows which words the user has been studying and naturally weaves them into conversation to reinforce learning

### Online / Offline Behaviour
- Charley is **not always online** — this is intentional, mimicking a real person
- Charley comes online **3–4 times per day** at random windows
- Each online window lasts **1 hour**
- When online, Charley **proactively sends the first message** (e.g. "Hey! What are you up to today?")
- When offline, the chat input is disabled and a status indicator shows "Charley is offline"
- If the user sends a message while Charley is offline, it is not delivered — the user sees a notice like "Charley is away right now, check back later"

### Notifications
- When Charley comes online, the app sends a **system notification** (even if minimized): "Charley is online — say hi!"
- Clicking the notification brings the app to focus and opens the Charley section

### Conversation Quality
- Charley should feel natural and not robotic
- System prompt defines Charley's persona, keeps conversation casual and friendly
- Charley should occasionally reference the user's learning progress without being preachy (e.g. "By the way, I heard you've been learning some new words lately...")
- Charley uses vocabulary from the user's studied word list naturally in sentences

### UI
- Sidebar item "Charley" with an online/offline status dot (green = online, grey = offline)
- Chat interface similar to the Chat section but with Charley's avatar/name at the top
- Status bar showing time remaining in the online window
- Messages styled like a messaging app (Charley on left, user on right)

### Future Considerations
- Persistent memory (once larger models are supported locally)
- Charley's personality customization
- Multiple friend characters

---

## Part 3 — Chat

### Overview
A general-purpose AI chat window — the user can talk to any installed Ollama model freely, like ChatGPT.

### Features
- Free-form text input (Enter to send, Shift+Enter for new line)
- Full markdown rendering (code blocks, bold, lists, etc.)
- Syntax highlighting for code
- Conversation history saved locally
- Sidebar shows past conversations with auto-generated titles
- Model selector — switch between installed Ollama models
- Streaming responses
- New chat button

### Differences from Charley
- Always available — no online/offline
- No persona — raw model
- No word bank integration
- Conversations saved to sidebar history

---

## Shared Infrastructure

### AI Engine
- All inference via local Ollama (HTTP proxy on localhost)
- Streaming SSE responses
- Model selection applies to Chat and WordMix; Charley uses a configurable model (default: same as selected)

### Word Bank
- ~7,000 CEFR-graded words (A1–C1)
- Stored as JSON, loaded at startup
- Fields: word, pos, level, difficulty, translation, pronunciation, frequency, tags

### SRS Engine
- SM-2 inspired algorithm
- Ratings: `again` / `later` / `dismiss`
- Weighted word selection using exponential decay: `e^(-0.1 × daysUntilDue)`
- Progress stored locally via Electron IPC (`load-progress` / `save-progress`)

### Theme
- Light / Dark mode toggle
- CSS variables for consistent theming across all three sections

---

## Future Roadmap

| Feature | Section | Notes |
|---|---|---|
| Japanese support | WordMix | New word bank + adjusted prompts |
| Spanish support | WordMix | New word bank + adjusted prompts |
| French support | WordMix | New word bank + adjusted prompts |
| Charley memory | Charley | Requires larger local model |
| Charley personality customization | Charley | Name, background, tone |
| Multiple AI friends | Charley | Different characters, different languages |
| Onboarding flow | All | First-run setup wizard |
| User profile | All | Name, native language, target language |
| Export progress | WordMix | CSV / Anki export |
| Word bank editor | WordMix | Add custom words |
