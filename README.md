# Quran.bid

**Quran.bid** — A SvelteKit rewrite of Quran.com with extra things.

A fast, mobile-friendly Quran reader built with SvelteKit and Svelte 5, deployed on Cloudflare Workers. It delivers a complete Quran reading and study experience powered by the Quran Foundation APIs.

## Live Demo

[https://quran.bid](https://quran.bid)

---

## What problem does this solve?

**Developer experience.** The current quran.com frontend is a large Next.js/Redux application that is slow to build, heavy to run locally, and difficult to contribute to. Quran.bid is a SvelteKit rewrite — significantly smaller bundle size, near-instant HMR, lower memory usage during development, and fast cold deploys on edge infrastructure.

**Keyboard-first navigation.** Quran.bid adds a keyboard shortcut system for power users — jump to search, navigate surahs, control audio playback, and explore the app without touching the mouse. This is aimed at developers, students, and anyone who spends long sessions with the Quran on a desktop.

**Learning through games.** Quran.bid includes interactive games (Which Surah? and Prev/Next Ayah) to make Quran learning active and habit-forming — turning occasional visitors into returning users who test and reinforce their knowledge.

---

## Who is it for?

- **Memorization students (huffaz)** — quiz games for people who have memorized part or all of the Quran
- **Daily readers** — reading history tracking, audio recitation, reading goals, clean distraction-free UI
- **Desktop power users** — keyboard shortcuts over clicking through menus
- **Customization-minded users** — 10 themes vs. Quran.com's one

---

## What's built beyond Quran.com

- **Interactive Games** — "Which Surah?" and "Prev/Next Ayah" quiz games to reinforce memorization
- **10 switchable themes** — Powered by DaisyUI 5 (caramellatte, valentine, lemonade, aqua, cyberpunk, light, dark, coffee, luxury, abyss). Press `T` to cycle.
- **Keyboard shortcuts** — `T` cycle theme, `M` open menu, `F` jump to footer, `R` go to radio, `K` open search, `S` reader settings, `?` open onboarding tour
- **Interactive onboarding tour** — Powered by Driver.js, walks new users through every feature on first visit. Press `?` anytime to replay.
- **Built on Svelte 5 runes** — Uses $state, $derived, $effect rather than the older options API

## Core features (parity with Quran.com)

- **Reader** — Translation view and Mushaf (page) view with multiple Arabic fonts (Uthmani, IndoPak, QCF v1/v2, Tajweed), adjustable font size, multi-translation support
- **Study Mode** — Per-verse modal with 8 contextual tabs: Tafsir, Layers, Reflections, Lessons, Qira'at, Hadith, Related Verses, Community Answers
- **Word by Word** — Per-word Arabic with translation and transliteration
- **Audio** — Verse-by-verse recitation with play/pause, repeat controls, reciter selection
- **Search** — Full-text search across the Quran
- **Radio** — Continuous Quran radio stream
- **Bookmarks** — Save and revisit verses
- **Reading History** — Automatic tracking of verses read (IntersectionObserver with 3-second dwell threshold)
- **Reading Goal** — Daily reading target with progress tracking
- **Navigation** — Surah list, Juz navigation, verse-level deep linking

---

## Routes

| Route | Notes |
|---|---|
| `/` — Home | Full surah list with search filter |
| `/[chapterId]` — Chapter reader | Translation view + Mushaf (page) view |
| `/[chapterId]/[verseId]` — Verse deep link | Jumps to specific verse |
| `/search` — Search | Full-text Quran search via QF API |
| `/radio` — Quran radio | Live stream with reciter info |
| `/games` — Games | "Which Surah?" + "Prev/Next Ayah" quizzes |
| `/my-quran` — Personal dashboard | Bookmarks + notes + reading goal overview |
| `/reading-history` — History | Auto-tracked verses |
| `/reading-goal` — Goal tracker | Daily reading target with progress |
| `/profile` — Profile | Avatar, display name, Quran.com OAuth |

---

## How We Used the APIs

### Quran Foundation Content API (gateway)

Used via a server-side proxy (`/api/proxy/content`) to keep credentials secure:

- **Chapters** — `/gateway/chapters` for surah list with Arabic/translated names
- **Verses** — `/gateway/verses/by_chapter/{id}` with fields for Arabic text, translations, word positions, page/juz/hizb metadata
- **Tafsir** — `/gateway/tafsirs/{id}/by_ayah/{key}` for per-verse commentary
- **Hadith References** — `/gateway/hadith_references/by_ayah/{key}/hadiths`
- **Layered Translations** — `/gateway/layered_translations/by_key/{key}`
- **Qira'at** — `/gateway/qiraat/matrix/by_verse/{key}` for recitation variant data
- **Related Verses** — `/gateway/related_verses/by_verse/{key}`
- **Audio** — `/gateway/audio_files/reciter/{id}/by_chapter/{id}`
- **Word by Word** — `/gateway/verses/by_key/{key}?words=true`
- **Search** — `/gateway/search`

**Batched count calls**: Batch count requests across 20-verse windows, reducing network requests from ~40 per page view to ~4.

### Quran Foundation Auth/User API

Used via a user-token proxy (`/api/proxy/qf-auth`) that forwards the logged-in user's QF OAuth token:

- **Activity Days** — `/activity-days` for reading history
- **Bookmarks** — `/bookmarks` for saving and retrieving bookmarked verses
- **Notes** — `/notes` for user reflections and notes per verse
- **Reading Goal** — `/goal/status` to check/create daily reading targets
- **Streaks** — `/streaks` for reading streak data
- **Questions/Answers** — `/questions/count-within-range` for community answers count per verse

### Authentication

- Login via Quran.com OAuth (QF identity provider) using `better-auth`
- QF access token stored server-side, used for user-specific API calls
- Fallback: email/password auth with local Neon PostgreSQL

---

## Technical Stack

| Layer | Technology |
|-------|-----------|
| Framework | SvelteKit 2 + Svelte 5 (runes) |
| Styling | Tailwind CSS + DaisyUI 5 |
| Database | Neon PostgreSQL + Drizzle ORM |
| Auth | better-auth + Quran.com OAuth |
| Deployment | Cloudflare Workers |
| Language | TypeScript |

## Developing

```sh
pnpm install
pnpm dev
```

## Building

```sh
pnpm build
```
