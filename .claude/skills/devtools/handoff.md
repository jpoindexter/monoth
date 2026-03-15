---
name: handoff
description: "Generate a structured continuation prompt capturing full context so work can resume seamlessly in a new session. Use when someone says: write this down, save context, handoff, I need to continue this elsewhere, running out of context."
---

# Handoff

Generate a structured handoff document that captures everything needed to continue work in a new Claude session without losing context.

## Process

1. **Review the conversation**: Identify all work done, decisions made, files changed, and remaining tasks.
2. **Check current state**: Run `git status`, `git diff`, and check for any uncommitted work.
3. **Generate the handoff document** following the format below.
4. **Save to file**: Write to a timestamped file at the project root or a location the user specifies.

## Handoff Document Format

```markdown
# Handoff — [Brief Description of Work]
Generated: [YYYY-MM-DD HH:MM]
Project: [Project name and path]
Branch: [Current git branch]

## What Was Accomplished
- [Completed task 1]
- [Completed task 2]
- ...

## Files Changed
| File | Status | What Changed |
|------|--------|-------------|
| path/to/file.ts | Modified | Added validation logic for... |
| path/to/new-file.ts | Created | New API endpoint for... |
| path/to/deleted.ts | Deleted | Replaced by... |

## Current State
- Build status: PASSING / FAILING (with error details)
- Tests: X passing, Y failing
- Uncommitted changes: YES / NO (list if yes)
- Deployment: [current state]

## In Progress (not finished)
- [Task that was started but not completed]
  - What's done: ...
  - What remains: ...
  - Where I left off: [specific file:line or step]

## Blocked / Needs Decision
- [Thing that needs user input or external dependency]
  - Options considered: ...
  - Recommendation: ...

## Key Decisions Made (and Why)
1. **[Decision]**: Chose X over Y because [reason]. This matters because [impact].
2. ...

## Exact Next Steps (in order)
1. [ ] First thing to do when resuming
2. [ ] Second thing
3. [ ] Third thing
...

## Context That's Easy to Lose
- [Non-obvious thing that matters: a gotcha, a constraint, a dependency]
- [Environment detail that affects the work]
- [Relevant conversation context that wouldn't be obvious from code alone]

## Continuation Prompt
Paste this into a new Claude session to resume:

---
[A self-contained prompt that gives a new Claude session everything it needs to continue. Include: project path, branch, what was done, what to do next, and any constraints or decisions that must be respected.]
---
```

## Rules

- The continuation prompt at the bottom must be self-contained. A new session should be able to pick up without reading the rest of the document.
- Include file paths as absolute paths.
- If there's uncommitted work, flag it prominently. Suggest committing or stashing before ending the session.
- Be specific about "where I left off" — file name, line number, function name, step in a multi-step process.
- Include any error messages or warnings that are relevant to the in-progress work.
- Save the handoff file with a clear name: `handoff-YYYY-MM-DD-HHMM-[brief-description].md`
- Default save location: project root. Ask if user prefers elsewhere.
- After saving, print the file path so the user can find it easily.
