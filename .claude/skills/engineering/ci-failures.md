---
name: ci-failures
description: Analyze CI test failures with parallel log analysis and root cause identification
license: MIT
compatibility: Claude Code
metadata:
  author: Vercel Next.js Team
  version: "1.0"
  priority: high
  source: https://github.com/vercel/next.js/blob/main/.claude/commands/ci-failures.md
allowed-tools:
  - Bash
  - Read
  - Task
  - WebFetch
---

# CI Failures Analysis

Analyzes failing tests from CI runs with parallel subagent log analysis.

## Usage

When CI tests fail, use this workflow to identify and fix issues efficiently.

## Core Workflow

### Step 1: Retrieve PR/Run Information

```bash
# Get PR checks status
gh pr checks <pr-number> | grep -i fail

# Get failed job names from a run
gh run view <run-id> --json jobs --jq '.jobs[] | select(.conclusion == "failure") | .name'
```

### Step 2: Identify Failed Jobs

Query all failed jobs with pagination (large repos may have 100+ jobs):

```bash
# List all jobs (paginated)
gh api repos/{owner}/{repo}/actions/runs/{run-id}/jobs --paginate \
  --jq '.jobs[] | select(.conclusion == "failure") | {name, id}'
```

### Step 3: Parallel Log Analysis

Spawn 3-4 subagents to analyze logs simultaneously. Use GitHub API for in-progress runs:

```bash
# Get logs for a specific job (works for in-progress runs)
gh api repos/{owner}/{repo}/actions/jobs/{job-id}/logs
```

**DO NOT use** `gh run view --log` for in-progress runs - it fails.

### Step 4: Extract Failure Information

For each failing test, extract:
1. **TEST FILE**: Full path to test file
2. **TEST NAME**: Specific test case name
3. **EXPECTED**: What the assertion expected
4. **RECEIVED**: What was actually received
5. **CATEGORY**: Type of failure (see categories below)
6. **ROOT CAUSE**: One sentence hypothesis

### Step 5: Deduplicate and Group

Group failures by test file path, not by CI job name. Count jobs with identical failures but report once.

## Failure Categories

| Category | Description | Example |
|----------|-------------|---------|
| **assertion** | Wrong output values | Expected "foo", got "bar" |
| **timeout** | Tests hanging | Jest timeout exceeded |
| **build** | Compilation errors | TypeScript error, missing deps |
| **routing** | Wrong routes/status | 404 instead of 200 |
| **source-map** | Path mismatches | webpack-internal:// paths |
| **cli-output** | Wrong log messages | Missing expected warnings |
| **infrastructure** | Transient/network | 503 errors, flaky |

## Priority Levels

- **HIGH**: Assertion failures with specific expected/received values
- **MEDIUM**: Consistent patterns across multiple jobs
- **LOW**: Likely transient (network, timing)

## Quick Triage Commands

```bash
# Search job logs for errors (completed runs only)
gh run view <run-id> --job <job-id> --log 2>&1 | grep -E "FAIL|Error|error:" | head -30

# Check for specific failure patterns
gh run view <run-id> --job <job-id> --log 2>&1 | grep -E "Expected|Received|EADDRINUSE|timeout"
```

## Common Fixes

| Pattern | Fix |
|---------|-----|
| `rust check / build` failed | Run `cargo fmt` locally |
| Prettier errors | Run `pnpm prettier --write <file>` |
| Test assertion failure | Run test locally to reproduce |
| EADDRINUSE | Port conflict - check parallel tests |
| Timeout | Check for missing await, slow async ops |

## Running Tests Locally

```bash
# Development mode
pnpm test-dev test/path/to/test.ts

# Production mode
pnpm test test/path/to/test.ts

# With debug output
DEBUG=* pnpm test test/path/to/test.ts
```

## Output Format

Create a summary table:

| Test File | Issue | Jobs Affected | Priority |
|-----------|-------|---------------|----------|
| `test/e2e/app.test.ts` | Expected "200", got "404" | 3 jobs | HIGH |
| `test/unit/utils.test.ts` | Timeout after 5000ms | 1 job | MEDIUM |

## Tips

- Don't spawn too many parallel agents hitting GitHub API (causes rate limits)
- Prioritize blocking jobs: lint, types, then test jobs
- Check run attempt counts - query specific attempts if needed
- For flaky tests, check if failure is consistent across attempts
