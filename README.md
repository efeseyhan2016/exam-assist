# EXAM ASSIST

EXAM ASSIST is a university-focused academic operating system.

It is built around one core promise:

**You import your exam schedule. The system gets you into studying.**

That promise is the starting wedge, not the whole ceiling.

The product is designed for students who do not need another generic planner, but a system that can turn real academic pressure into a clear next move across exams, tasks, resources, deadlines, and ongoing academic progress.

## What It Does

- imports exam schedules from real PDFs
- helps students select only the courses that belong to them
- builds a personalized academic picture from exams, tasks, sessions, resources, and profile context
- shows a daily brief and first study recommendation
- lets students upload course materials and open PDFs inside the app
- syncs account state and resources across devices with Supabase

## Current Product Shape

The current version is an early but real product, not a static demo.

Main surfaces:
- `Home`: daily brief, nearest academic pressure, current focus
- `Priorities`: risk-ranked subject board
- `Sessions`: study logging and reflection
- `Calendar`: imported exam timeline
- `Resources`: course library, upload, preview, first-source guidance
- `Profile`: personal study context

## Core Product Thesis

Most student products either store information or help with isolated study tasks.

EXAM ASSIST sits in the middle:
- it understands the student's real academic timeline
- it understands what they uploaded
- it learns from what they actually study and complete
- it tries to answer one question well:

**What should I do right now?**

## Intelligence Layers

The product already includes multiple non-LLM intelligence layers:

- PDF import selection learning
- behavior-aware focus recommendations
- resource-type guidance
- subject study-mode inference
- session reflection feedback
- topic hint extraction from uploaded materials
- subject learning profiles
- exam proximity mode shifts

The principle behind all of them is:

**hidden intelligence, visible clarity**

A matching architecture rule now guides the next phase:

**first build structured academic ground, then use AI to add semantic depth**

## Stack

- `Next.js 15`
- `React 19`
- `Tailwind CSS`
- `Supabase Auth`
- `Supabase Postgres`
- `Supabase Storage`
- `Vercel`

## Local Development

Install dependencies:

```bash
npm install
```

Run the app:

```bash
npm run dev
```

Run tests:

```bash
npm test
```

Run lint:

```bash
npm run lint
```

## Deployment Helpers

The repo includes a few lightweight workflow scripts:

- `npm run deploy:prod`
- `npm run check:live`
- `npm run supabase:apply`

## Important Docs

- [PRODUCT_STRATEGY.md](/Users/vatan/Documents/EXAM%20ASSIST/PRODUCT_STRATEGY.md)
- [PROJECT_VISION.md](/Users/vatan/Documents/EXAM%20ASSIST/PROJECT_VISION.md)
- [ROADMAP.md](/Users/vatan/Documents/EXAM%20ASSIST/ROADMAP.md)
- [NOW_SPRINT.md](/Users/vatan/Documents/EXAM%20ASSIST/NOW_SPRINT.md)
- [HOW_EXAM_ASSIST_WORKS.md](/Users/vatan/Documents/EXAM%20ASSIST/HOW_EXAM_ASSIST_WORKS.md)

## Current Status

EXAM ASSIST is currently in a strong MVP / early beta stage.

It already supports:
- account-based auth
- cloud-backed persistence
- PDF exam import
- study logging
- uploaded resource preview
- action-oriented home guidance

The remaining work is mostly around polish, QA, feedback loops, and sharpening the academic experience rather than inventing the product from scratch.
