# How EXAM ASSIST Works

## What this product is

EXAM ASSIST is a premium, local-first study command center for high-pressure academic periods.

Its purpose is to help users:
- organize what is coming up
- understand what deserves attention now
- track study progress
- manage study materials and academic work
- move through exam periods with more clarity

The product is designed for people who need guidance and structure, not just another place to store information.

---

## Who it is for

Primary users:
- students in exam-heavy periods
- users managing multiple courses, deadlines, and study materials
- people who want clear prioritization during stressful academic weeks

Potential future users:
- working learners
- certification learners
- users balancing study with work

For now, the product should stay strongly student-centered.

---

## Core product loop

The product works through a simple loop:

1. the user sees what is coming up
2. the user sees what deserves attention now
3. the user studies, logs progress, or updates work
4. the system updates the planning picture
5. the user continues with less confusion

This loop should remain the center of the product.

---

## How a new user should start

A new user should not have to "figure out the app."
The system should guide them through a structured setup.

The ideal first-time flow is:

1. user enters profile context
   - student / worker
   - department / role
   - preferred language
   - general study context

2. user adds academic structure
   - courses / subjects
   - exam names
   - exam dates and times
   - assignment / project dates if relevant

3. user provides planning inputs for each subject
   - difficulty
   - topic length / scope
   - source access / resource availability
   - study type (memorization, numerical, open-book, etc.)
   - current confidence / current level
   - target expectation
   - special constraints

4. user provides study constraints
   - daily study capacity
   - sleep constraints
   - exam-morning behavior
   - preferred work rhythm

5. system produces an initial planning model
   - priority order
   - risk-based ranking
   - estimated pressure by subject
   - recommended focus direction

This setup flow is a core product need, not an optional feature.

---

## What data the system needs

To generate meaningful planning guidance, EXAM ASSIST needs structured inputs.

### Required planning inputs
- subjects / courses
- exam schedule
- daily study capacity
- current progress or current level

### Important quality inputs
- difficulty
- topic length / scope
- resource access
- study type
- open-book / closed-book
- urgency and date proximity
- sleep constraints around exam days

Without these inputs, planning intelligence becomes weak or overly generic.

---

## How priorities and risk should be created

The priorities system should not be random or purely decorative.

The system should combine:
- time pressure
- remaining study capacity
- subject difficulty
- topic length
- resource constraints
- current progress
- exam closeness
- special relief factors (such as open-book)

The purpose of the model is not to pretend to be mathematically perfect.
Its purpose is to produce a directionally trustworthy answer to:

**What deserves attention now, and why?**

The output should always be honest about confidence.
If something is estimated, it should be presented as estimated.

---

## Main surfaces and what they do

### Home
Home should answer:
- what is coming up soon?
- what does this week look like?
- where should I orient myself first?

It is the orientation surface.

### Priorities
Priorities should answer:
- what deserves attention now?
- why is this subject higher?
- how much pressure is building?

It is the planning surface.

### Sessions
Sessions should answer:
- what did I study?
- how much did I do today?
- what changed after I logged progress?

It is the execution/progress surface.

### Schedule
Schedule should answer:
- what dates, exams, and deadlines exist?
- what has been imported or added?
- what is my academic timeline?

It is the timeline surface.

### Resources / Library (future)
This should answer:
- what materials do I have?
- what did I finish?
- what still needs review?

It will become the materials surface.

### Tasks / Projects / Assignments (future)
This should answer:
- what work exists beyond exams?
- what deadlines are approaching?
- what needs structured follow-through?

It will become the coursework surface.

---

## What is core vs secondary

### Core
- onboarding clarity
- profile/context setup
- exams and schedule
- priorities / planning
- study logging
- local persistence
- resources / PDFs
- tasks / assignments / projects

### Secondary
- notes
- grade history
- daily briefings
- deeper personalization
- AI assistance

### Explicitly later / optional
- collaboration
- shared study rooms
- group chat
- voice features
- social/community mechanics
- screen sharing

These features are not forbidden, but they must not distract from the core product.

---

## Current gaps

The current build already has meaningful pieces:
- onboarding
- app shell with navigation
- Home direction
- approaching exams / next exam
- schedule intake/import
- study logging
- local persistence
- priorities / risk-ranked board

But there are still important gaps.

### Current major gap
The app does not yet have a fully generalized setup layer for new users.

Right now, the planning/risk experience still depends too heavily on pre-seeded assumptions and manually known constraints.

That means:
- the app is useful in a guided/local context
- but it is not yet fully generalized for any new user who arrives fresh

This is a major product priority.

### Other important gaps
- imported schedule data is not fully unified with the planning engine
- model trustworthiness still needs work
- storage/data integrity needs hardening
- some architecture still reflects rapid iteration
- some surfaces are stronger than others

---

## Long-term direction

Over time, EXAM ASSIST can evolve into a richer academic operating system.

Long-term possibilities:
- better planning intelligence
- PDF/resource library
- tasks and projects
- grade history
- daily briefings
- AI support
- collaboration, if justified later

But the right order is:

1. make the product trustworthy
2. make the product clear
3. make the product genuinely useful
4. then make the product broader

---

## Final rule

EXAM ASSIST should grow by becoming better at:
- guidance
- priorities
- trust
- clarity
- study flow

before becoming bigger at the edges.
