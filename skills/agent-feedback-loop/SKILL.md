---
name: agent-feedback-loop
description: Use when Codex and Claude are collaborating on EXAM ASSIST through repo files instead of live chat. This skill defines the shared handoff protocol, which files to read first, how to record findings, and how to leave the next agent a compact, actionable request without creating noisy documentation.
---

# Agent Feedback Loop

Use this skill when EXAM ASSIST work is split across Codex and Claude and the handoff must happen through files in the repository.

This is a file-based collaboration protocol, not a live agent channel.

## Read First

1. Read `/Users/vatan/Documents/EXAM ASSIST/AGENT_FEEDBACK/ACTIVE_HANDOFF.md`
2. Read `/Users/vatan/Documents/EXAM ASSIST/AGENT_FEEDBACK/DECISION_LOG.md` only if the handoff references a prior decision or tradeoff.
3. Read only the repo files named in the handoff. Do not roam widely unless blocked.

## Core Rule

Leave the next agent a smaller problem than the one you received.

Every handoff should answer:
- what is the exact problem now
- what is already known
- what was changed or verified
- what should happen next

## Handoff Workflow

### When starting work

- Read `ACTIVE_HANDOFF.md`
- Confirm the current goal, non-goals, and expected next step
- Treat the file as the current shared truth unless the repo clearly contradicts it

### While working

- Keep work scoped to one micro-pack when possible
- Prefer evidence over opinion
- If a claim depends on code, tests, or browser behavior, name the file or verification step

### When handing off

Update `ACTIVE_HANDOFF.md` with:
- `Current Goal`
- `What Changed`
- `What Was Verified`
- `Open Risks / Unknowns`
- `Next Recommended Pass`
- `Files To Read Next`

Keep each section concise.
Do not turn the handoff into a diary.

## Decision Logging

If you make or confirm a product/architecture decision that should survive multiple handoffs, append one short entry to:

- `/Users/vatan/Documents/EXAM ASSIST/AGENT_FEEDBACK/DECISION_LOG.md`

Log only decisions that matter later:
- accepted product framing
- explicit non-goals
- architecture boundaries
- scoring/ranking rules
- reasons for rejecting a tempting direction

## Writing Standard

Use:
- short paragraphs
- direct language
- calm tone
- concrete file references when useful

Avoid:
- long narrative recaps
- speculative brainstorming in the handoff file
- generic praise
- repeating repo philosophy unless it affects the current step

## Required Boundaries

- Do not treat the handoff file as a permanent spec
- Do not duplicate large reasoning already captured elsewhere
- Do not overwrite prior decisions casually; add a correction note if a previous decision changed

## Good Handoff Shape

- problem is narrow
- verification is explicit
- next pass is obvious
- named files are enough to continue

If the handoff is getting bloated, compress it before leaving.
