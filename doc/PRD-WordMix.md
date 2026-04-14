# PRD: WordMix — Contextual Vocabulary Learning

## Overview

WordMix is a vocabulary learning feature for JustAsk that helps Chinese-speaking users learn English words through **contextual code-switching**. Instead of traditional flashcards, the AI generates natural Chinese sentences with the target English word embedded in place of its Chinese equivalent — forcing the learner to absorb the English word in a familiar, meaningful context.

**Example:**
- Target word: `abandon`
- AI generates: 他决定 **abandon** 这个计划，重新开始新的生活。
- The user reads a sentence they fully understand in Chinese, but must process the English word `abandon` (放弃) in context.

This approach leverages how bilingual speakers naturally code-switch, making vocabulary acquisition feel intuitive rather than mechanical.

---

## Problem Statement

Traditional vocabulary learning (flashcards, word lists) is:
- **Boring** — rote memorization with no narrative
- **Context-free** — words are learned in isolation, not in meaningful sentences
- **Disconnected** — the learner's native language is treated as an obstacle, not a bridge

Chinese learners especially struggle because English and Chinese are linguistically distant. WordMix bridges the gap by embedding English words directly into Chinese sentences the user already understands.

---

## Target Users

- Chinese-speaking learners of English (HSK native, learning English)
- Levels ranging from beginner (A1) to advanced (C1)
- Users who find traditional flashcard apps tedious
- Users who want to build vocabulary while reading natural sentences

---

## App Modes

JustAsk supports multiple interaction modes. The user can switch between them. Each mode uses the **same chat layout** (same message bubbles, same streaming) but differs in how input works.

| Mode | Input method | Purpose |
|---|---|---|
| **Chat** (existing) | Free-text typing | General AI conversation |
| **WordMix** | Buttons only (no typing) | Vocabulary study sessions |
| *(Future modes)* | Buttons / tap / mixed | Quizzes, grammar drills, etc. |

When a mode is active, the **bottom input area adapts** — the text input may be disabled or hidden, replaced by contextual action buttons. The rest of the UI (header, sidebar, message bubbles) stays identical.

---

## Core Features

### 1. Word Bank (10,000 words)

A structured vocabulary database with ~10,000 English words. **The full word bank must be created before building any UI.**

**Word entry schema:**

| Field | Type | Description |
|---|---|---|
| `word` | string | The English word (e.g. `abandon`) |
| `pos` | string | Part of speech: `noun`, `verb`, `adj`, `adv`, `prep`, etc. |
| `level` | string | CEFR level: `A1`, `A2`, `B1`, `B2`, `C1` |
| `difficulty` | string | Simple / Medium / Hard (derived from level) |
| `translation` | string | Primary Chinese translation (e.g. 放弃) |
| `pronunciation` | string | IPA phonetic (e.g. `/əˈbændən/`) |
| `tags` | string[] | Topic tags: `travel`, `business`, `daily`, `academic`, etc. |
| `examples` | string[] | 2-3 example English sentences |
| `frequency` | number | Usage frequency rank (1 = most common) |

**Level mapping:**

| CEFR | Label | Word Count (approx) | Description |
|---|---|---|---|
| A1 | Simple | ~1,000 | Basic survival words (hello, eat, school) |
| A2 | Simple | ~1,500 | Everyday conversation (weather, shopping) |
| B1 | Medium | ~2,500 | Independent communication (opinions, news) |
| B2 | Medium | ~3,000 | Complex topics (abstract ideas, work) |
| C1 | Hard | ~2,000 | Advanced/academic (nuance, formal writing) |

**Data source options:**
- Oxford 5000 / New General Service List (NGSL) as the base
- CEFR levels from official Cambridge/Oxford level assignments
- Chinese translations from CC-CEDICT or MDBG dictionary
- Curated and deduplicated

**Storage:** JSON file bundled with the app, loaded into memory at startup. Optionally stored in a local SQLite database if search performance requires it.

---

### 2. AI Sentence Generation (Code-Switch Engine)

The core learning mechanic. The AI generates a **Chinese sentence** with the **target English word** naturally embedded.

**How it works:**

1. User taps a level button (e.g. "B1") — the system picks a random word from that level
2. A **short friendly message** appears as the user bubble (e.g. "New B1 word") — NOT the raw prompt
3. The full prompt is sent to Ollama behind the scenes:

```
你是一个中英混合造句助手。请用中文造一个自然的句子，但是把「{chinese_translation}」替换成英文单词「{english_word}」。

要求：
- 句子要自然、日常，像中国人说话时夹杂英文一样
- 句子长度 15-30 个字
- 不要解释这个单词的意思
- 只输出句子，不要其他内容

单词：{english_word}（{chinese_translation}）
词性：{pos}
```

4. AI responds in a normal assistant bubble with the code-switch sentence
5. **After streaming finishes**, a styled **word info card** is appended below the bubble (rendered by the app, not the AI):

```
📖 abandon  /əˈbændən/  [B1 · verb]
```

This card is built from word bank data and always accurate — it doesn't depend on the AI output.

**Sentence quality rules:**
- The English word must be used correctly (right part of speech, natural position)
- The Chinese context must make the word's meaning inferable
- Sentences should be conversational, not textbook-stiff
- Vary sentence topics (daily life, work, social, travel, etc.)

---

### 3. Learning Flow (UI) — Button-Driven Chat

WordMix reuses the **existing chat layout** entirely. The key difference: the text input at the bottom is **disabled**, and **action buttons** appear above it. Tapping a button sends a pre-built prompt to the AI, and the response streams into the chat as a normal assistant bubble.

#### 3.1 Initial State (No Session Started)

When the user enters WordMix mode, the chat area is empty. The bottom of the screen shows:

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│              🍃 Pick a level to start                │
│                                                     │
│   [ A1 ]  [ A2 ]  [ B1 ]  [ B2 ]  [ C1 ]  [ All ] │
│                                                     │
│   ┌───────────────────────────────────────────────┐ │
│   │  Message input (disabled / grayed out)        │ │
│   └───────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

- Level buttons appear above the disabled text input
- Text input is visible but **disabled** (grayed out, placeholder: "Tap a level to start")
- Tapping a level button: picks a random word from that level, shows "New B1 word" as user bubble, sends the full prompt to AI, AI streams the response
- **"All" picks randomly from any level**

#### 3.2 Active Session (After First Word)

Once the AI **finishes streaming** the response, the buttons change to the **learning action buttons**:

```
┌─────────────────────────────────────────────────────┐
│ ┌─ user bubble ──────────────────────────────────┐  │
│ │ New B1 word                                    │  │
│ └────────────────────────────────────────────────┘  │
│                                                     │
│ ┌─ assistant bubble ─────────────────────────────┐  │
│ │ 他决定 abandon 这个计划，重新开始新的生活。         │  │
│ └────────────────────────────────────────────────┘  │
│ ┌─ word info card (app-rendered, not AI) ────────┐  │
│ │ 📖 abandon  /əˈbændən/  [B1 · verb]            │  │
│ └────────────────────────────────────────────────┘  │
│                                                     │
│   [ 😕 Hard ]  [ 🤔 Okay ]  [ 😊 Easy ]            │
│   [ Show Meaning ]  [ Next Word → ] [ Change Level ] │
│                                                     │
│   ┌───────────────────────────────────────────────┐ │
│   │  Message input (disabled)                     │ │
│   └───────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

**Important timing:** The action buttons only appear **after the AI finishes streaming**. While streaming, the user sees the sentence building character by character with no buttons — they read the full sentence first, then interact.

**Button actions:**

| Button | What happens |
|---|---|
| **Hard / Okay / Easy** | Records self-assessment for SRS. The tapped button highlights briefly, then **all three disappear** (one rating per word, no changes allowed). The other buttons (Show Meaning, Next Word, Change Level) remain. |
| **Show Meaning** | **Instantly** reveals the Chinese translation from the word bank below the word info card (no AI call). Then shows an additional **"Explain More"** button. If tapped, sends a follow-up prompt to the AI for a detailed explanation in a new bubble pair. |
| **Next Word** | Picks a new word (same level as current session), sends new prompt, AI responds with new sentence. Continues in the **same conversation**. |
| **Change Level** | Swaps the action buttons back to the level picker (A1-C1 + All). Continues in the **same conversation** — does NOT start a new one. |

#### 3.3 Show Meaning — Two-Step Reveal

```
Step 1: User taps [Show Meaning]
──────────────────────────────────────
  📖 abandon  /əˈbændən/  [B1 · verb]
  💡 放弃                              ← instant, from word bank
  [ Explain More ]                     ← optional AI follow-up

Step 2 (optional): User taps [Explain More]
──────────────────────────────────────
  User bubble:  "Explain abandon"
  AI bubble:    "abandon 意思是'放弃'，通常用于..."
```

This gives instant feedback (no waiting for AI) while still offering a deeper explanation on demand.

#### 3.4 Conversation Continuity

The whole session is a **single conversation thread** in the chat, saved as one conversation in the sidebar (e.g. "WordMix · B1 · Apr 13"). Each word generates a user bubble + assistant bubble + word card. After several words, the user has a scrollable history of everything they studied.

Changing levels mid-session continues in the **same conversation** — it does not create a new one.

```
User:    New B1 word
AI:      他决定 abandon 这个计划，重新开始新的生活。
         📖 abandon /əˈbændən/ [B1 · verb]

User:    Next word
AI:      这个新系统非常 efficient，节省了很多时间。
         📖 efficient /ɪˈfɪʃənt/ [B1 · adj]

User:    Explain efficient
AI:      efficient 意思是"高效的"，形容做事快速且不浪费资源。

User:    New A2 word                    ← changed level, same conversation
AI:      我下班后要去 grocery store 买点菜。
         📖 grocery /ˈɡroʊsəri/ [A2 · noun]
```

#### 3.5 Mixed Paragraph Mode ("Make a sentence with my words")

After the user has studied a few words, a new button appears in the learning phase: **"Make a sentence with my words"**. This generates a longer Chinese paragraph with multiple English words embedded — purely for reading exposure, no rating.

**Rules:**
- **Source words**: only words the user has already studied (from progress data)
- **Word count**: auto-scales based on how many words have been studied:
  - 3-5 studied → uses 3 English words
  - 6-15 studied → uses 5 English words
  - 16+ studied → uses up to 10 English words
- **Button visibility**: hidden until the user has studied at least 3 words
- **Output**: one long paragraph (3-5 sentences) in Chinese with the English words naturally mixed in
- **No rating**: purely for exposure — user reads it and moves on
- **Interaction**: after the paragraph, the same learning buttons reappear (Next Word, Change Level, etc.)

**Prompt template:**
```
你是一个中英混合写作助手。请用中文写一段话（3-5句话），但是把以下单词用英文替换对应的中文：

{word_list with translations}

要求：
- 段落要自然流畅，像一个中国人日常写作时夹杂英文一样
- 所有英文单词都要用对，词性和语境正确
- 不要解释单词的意思
- 只输出段落，不要其他内容
```

**Example output (5 words: abandon, efficient, grocery, accomplish, confident):**
```
今天早上我决定 abandon 之前的工作计划，用一种更 efficient 的方式
重新安排。午饭后去了 grocery store 买了些食材，回来继续工作，
终于 accomplish 了这个月的目标。现在我对下个月的计划感到很 confident。
```

**User bubble**: "Make a sentence with my words"
**No word card** below this response — it's a reading exercise, not a vocabulary drill.

#### 3.6 Self-Assessment Behavior (unchanged)

When the user taps a rating button:

1. The tapped button briefly highlights (e.g. green flash for Easy)
2. All three rating buttons (Hard / Okay / Easy) disappear
3. A small label appears near the word card: "Rated: Easy ✓"
4. The rating is saved for SRS scheduling
5. The remaining buttons (Show Meaning, Next Word, Change Level) stay visible

**One rating per word.** No undo, no changing. This keeps the flow fast.

#### 3.6 Progress Tracking

- Words learned (by level)
- Daily streak
- Words due for review
- Accuracy over time (% marked "Easy" vs "Hard")

Stored locally in Electron's `userData` (JSON or SQLite).

#### 3.7 Spaced Repetition (SRS)

Use a simplified SM-2 algorithm:
- Words marked **Easy** → review in 7 days
- Words marked **Okay** → review in 2 days
- Words marked **Hard** → review in 4 hours (same session or next)
- After multiple "Easy" reviews, interval grows (14d → 30d → 90d)

When the user has words due for review, the initial state shows a **Review** button alongside the level buttons.

---

### 4. Mode Switching

The user needs a way to enter/exit WordMix mode.

**Option: Header toggle** (like the existing Playground toggle)

A "WordMix" button in the header bar. When active:
- Chat input area switches to button-driven mode
- Conversation history is separate from normal chat (different conversation in sidebar, tagged as "WordMix")
- Header button shows active state

When toggled off:
- Returns to normal chat mode with free-text input
- WordMix conversation is saved in sidebar like any other conversation

**Sidebar distinction:**
- WordMix conversations show a 📖 icon to distinguish from normal chats
- Or: a separate "WordMix" section in the sidebar

---

## Design Decisions (from interview)

| # | Question | Decision |
|---|---|---|
| 1 | User bubble display | **Short friendly message** (e.g. "New B1 word"), NOT the raw prompt |
| 2 | Word info in assistant bubble | **App-rendered card below the bubble** with word, pronunciation, level, POS — not AI-generated |
| 3 | Conversation scope | **Single conversation** saved in sidebar (e.g. "WordMix · B1 · Apr 13") |
| 4 | Show Meaning | **Instant translation from word bank** + optional "Explain More" button for AI follow-up |
| 5 | Switching levels mid-session | **Same conversation** continues, does not start a new one |
| 6 | Rating buttons after tap | **Disappear after one tap** (one rating per word, no changes) |
| 7 | First-time experience | **None for now** — jump straight to level picker |
| 8 | Word bank creation | **Generate all 10,000 words before building any UI** |
| 9 | "All" level button | **Random from any level** (no weighting, no progression) |
| 10 | When to show action buttons | **After AI finishes streaming** (user reads full sentence first) |
| 11 | Word info card detail level | **Medium:** word + pronunciation + level + POS |
| 12 | Mixed paragraph — word source | **Words already studied** (from progress data) |
| 13 | Mixed paragraph — output format | **One long paragraph** with 3-10 English words mixed in |
| 14 | Mixed paragraph — after reading | **No rating** — purely for exposure |
| 15 | Mixed paragraph — button location | **Learning phase** — "Make a sentence with my words" |
| 16 | Mixed paragraph — word count | **Auto-scale**: 3 words (3-5 studied), 5 words (6-15), 10 words (16+) |
| 17 | Mixed paragraph — minimum | **Hidden until 3+ words studied** |

---

## Technical Design

### UI Changes

```
src/
  components/
    ChatArea.jsx           ← modified: supports button-driven mode
    WordMixButtons.jsx     ← NEW: the action button bar (levels, Hard/Okay/Easy, etc.)
    WordInfoCard.jsx       ← NEW: styled word card (pronunciation, level, POS)
```

**ChatArea changes:**
- New prop or context value: `mode` ('chat' | 'wordmix')
- When `mode === 'wordmix'`:
  - Text input is disabled (gray, no cursor)
  - `<WordMixButtons />` renders above the input area
  - Buttons call `sendMessage(prebuiltPrompt)` — same function as normal chat
  - But the **user bubble shows a friendly label**, not the raw prompt
  - After streaming ends, `<WordInfoCard />` is appended below the assistant bubble
- When `mode === 'chat'`:
  - Normal behavior, no changes

**WordMixButtons component:**
- Manages local state: `phase` ('pick-level' | 'learning')
- `pick-level` phase: shows A1 / A2 / B1 / B2 / C1 / All buttons
- `learning` phase (shown only after streaming ends): shows Hard / Okay / Easy + Show Meaning + Next Word + Change Level
- Each button click:
  1. Picks a word from the word bank (if needed)
  2. Builds a prompt string
  3. Calls `sendMessage(prompt)` from AppContext — but with a `displayText` override for the user bubble
  4. Updates local phase state

**WordInfoCard component:**
- Renders below the assistant bubble after streaming ends
- Shows: word, IPA pronunciation, CEFR level badge, POS tag
- Optionally shows Chinese translation (after "Show Meaning" is tapped)
- Optionally shows "Rated: Easy ✓" label after self-assessment

### Data Layer

```
src/
  data/
    wordbank.json          ← 10,000 word entries (MUST be created first)
  lib/
    wordbank.js            ← load, filter, search, pick random word
    srs.js                 ← spaced repetition scheduler
  context/
    AppContext.jsx          ← add: mode state, current word, session level
```

### IPC Additions (main.js)

```javascript
// Persist learning progress
ipcMain.handle('load-progress', () => readProgress());
ipcMain.handle('save-progress', (_e, data) => writeProgress(data));
```

### Prompt Engineering

The code-switch sentence prompt should be tuned for the local model (Gemma). Key considerations:
- Gemma 4 handles Chinese well
- Keep the system prompt short for faster generation
- Temperature ~0.8 for variety, but not too creative
- If the model generates a bad sentence (wrong POS, too long), retry once
- The full prompt is sent to the AI, but the user bubble displays a friendly label (e.g. "New B1 word")

### Word Bank Generation

The 10,000-word list can be bootstrapped by:
1. Start with NGSL (New General Service List) — ~2,800 most frequent words
2. Add Oxford 5000 — fills B2/C1 range
3. Assign CEFR levels from Cambridge English Profile
4. Generate Chinese translations via batch API or dictionary lookup
5. Manual QA pass on top 1,000 words

---

## Milestones

### Phase 1 — Word Bank (BLOCKING — must complete before any UI)
- [ ] Create the word bank JSON (10,000 words with levels, translations, POS, pronunciation)
- [ ] Build `wordbank.js` — load, filter by level, pick random word
- [ ] Validate data quality (no duplicates, all fields filled, levels correct)

### Phase 2 — Mode Switching & Button UI
- [ ] Add `mode` state to AppContext ('chat' | 'wordmix')
- [ ] Add WordMix toggle button to header
- [ ] Build `WordMixButtons.jsx` — level picker phase (A1-C1 + All)
- [ ] Modify `ChatArea.jsx` — disable input in WordMix mode, render buttons above input
- [ ] Buttons appear only after AI finishes streaming

### Phase 3 — Core Learning Flow
- [ ] Wire level buttons to `sendMessage()` with pre-built prompts
- [ ] User bubble shows friendly label (e.g. "New B1 word"), not raw prompt
- [ ] Build `WordInfoCard.jsx` — word, pronunciation, level, POS
- [ ] Append word info card below assistant bubble after streaming ends
- [ ] AI sentence generation prompt tuning
- [ ] Learning action buttons: Next Word, Change Level

### Phase 4 — Self-Assessment & Show Meaning
- [ ] Hard / Okay / Easy buttons — disappear after one tap, show "Rated: X ✓"
- [ ] Show Meaning — instant Chinese translation from word bank
- [ ] Explain More — optional AI follow-up prompt

### Phase 5 — Progress & SRS
- [ ] Build progress persistence (load/save via IPC)
- [ ] Implement SM-2 spaced repetition
- [ ] "Review" button when words are due
- [ ] Progress stats (words learned, streak, accuracy)
- [ ] WordMix conversations tagged with 📖 icon in sidebar

### Phase 6 — Polish
- [ ] Sentence quality validation (retry bad generations)
- [ ] Audio pronunciation (TTS via browser API)
- [ ] Dark/light theme support for WordMix buttons and word cards
- [ ] Animations (button highlight on rating, card reveal)

---

## Open Questions

1. **Which local model works best?** — Gemma 4 (12B) handles Chinese well, but smaller models (e2b/e4b) may struggle with natural code-switching. Need testing.
2. **Offline word bank or AI-generated translations?** — Pre-baked translations are faster and more reliable. AI can supplement with example sentences.
3. **Should we support other L1 languages?** — Start with Chinese only, but the architecture should allow swapping the prompt language.
4. **Sentence caching?** — Should we cache generated sentences to avoid re-generating for the same word? Pros: faster. Cons: less variety.
5. **Word bank format?** — Single JSON file vs SQLite. JSON is simpler for <10K entries. SQLite if we need full-text search or complex queries.
