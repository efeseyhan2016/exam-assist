# EXAM ASSIST Case Study

## Summary

EXAM ASSIST is a full-stack university study product built to close the gap between knowing you have exams and actually sitting down to study the right thing.

The core idea is simple:

**A student imports a real exam schedule PDF, and the product turns that pressure into structured action.**

## The Problem

Most student tools solve the wrong problem.

Students already have:
- calendars
- notes apps
- screenshots
- random PDFs
- chat groups

What they usually do not have is a system that can look at their real exam schedule, real course materials, and real study behavior and give them a calm, trustworthy next step.

That is the problem EXAM ASSIST is built to solve.

## Product Thesis

EXAM ASSIST is not meant to be:
- a generic productivity app
- a timer
- a chat wrapper
- a note app with AI sprinkled on top

It is meant to be a **study operating system**.

Its job is to answer:

**What should I do right now, and why?**

## What I Built

### 1. Real exam intake

The app parses real university exam schedule PDFs and extracts candidate exams.

Students then select only the courses that belong to them instead of manually rebuilding their schedule from scratch.

### 2. Planning and prioritization

The app builds a study picture from:
- exam timing
- remaining time
- logged sessions
- study constraints
- uploaded resources
- profile context

This powers:
- a risk-ranked priorities board
- daily focus recommendations
- first-step guidance on the Home screen

### 3. Resource intelligence

Students can upload course materials and keep them attached to subjects.

The system:
- classifies resource types
- extracts topic hints
- recommends how the source should be used
- lets the student open uploaded PDFs inside the app
- syncs resources across devices through Supabase Storage

### 4. Behavioral learning

The product does not only store data. It learns softly from behavior.

Signals include:
- which imported exams the student selects
- what subjects they actually study
- session length and repetition
- quick reflection after a session
- topic selections across sessions
- which resources they return to

This creates a system that gets more useful over time without turning into an opaque black box.

## Architecture

### Frontend
- `Next.js 15`
- `React 19`
- `Tailwind CSS`

### Backend / Platform
- `Supabase Auth`
- `Supabase Postgres`
- `Supabase Storage`
- `Vercel`

### Product intelligence

The current version uses deterministic and behavior-aware product logic rather than an LLM-first architecture.

Key layers:
- import selection intelligence
- subject study-mode inference
- resource guidance
- daily brief generation
- exam proximity mode shifts
- subject learning profiles

## Why This Project Is Strong

This is not a tutorial clone.

It demonstrates:
- document parsing
- full-stack product architecture
- auth and cloud state management
- cross-device resource sync
- decision systems and prioritization
- behavioral signal design
- product strategy, not just implementation

The most important part is that the project is not just feature accumulation.
It is built around a clear product thesis and a compounding intelligence model.

## Design Principle

The most important rule behind the product is:

**hidden intelligence, visible clarity**

The system can be sophisticated underneath, but what the student should feel is simple:

“I know what to do now.”

## Current Stage

EXAM ASSIST is currently in an early beta / strong MVP stage.

It already supports:
- account-based auth
- cloud-backed study state
- exam import
- session logging
- resource upload and preview
- action-oriented home guidance

The biggest remaining work is:
- UX polish
- edge-case cleanup
- responsive QA
- refinement of the first-study flow

## Future Direction

The long-term direction is to deepen the study operating system, not to broaden into a generic productivity suite.

That means:
- better guidance
- better retention loops
- better resource understanding
- eventually an AI layer that is grounded in real student data and real course materials

Not:
- social feed features
- shallow gamification
- AI pasted everywhere

## One-Line CV Version

Built a full-stack university study operating system that parses real exam schedule PDFs, syncs course resources across devices, and uses behavior-aware planning to turn academic pressure into concrete study guidance.
