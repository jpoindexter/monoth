---
name: ship
description: "Full ship pipeline: pre-flight checks, commit, push, deploy, verify. Use when someone says: ship it, push to git, deploy, push and deploy. Asks before each destructive step."
---

# Ship

Full shipping pipeline from pre-flight checks through deployment verification.

## Process

### Step 1: Pre-Flight Checks

Run ALL of these before committing:

1. **No secrets exposed**: Scan for API keys, tokens, passwords, .env values in tracked files. Check that .env is in .gitignore.
2. **No console.logs**: Search for console.log, console.warn, console.error that aren't intentional (logging libraries are fine).
3. **Build passes**: Run the project's build command (`npm run build`, `next build`, etc.). If it fails, fix the issues.
4. **Types check**: Run `tsc --noEmit` or equivalent. Fix type errors.
5. **Lint passes**: Run the project's lint command if configured.
6. **Tests pass**: Run `npm test` or equivalent if tests exist. Do not skip failing tests.
7. **No merge conflicts**: Check for conflict markers in files.
8. **Dependencies up to date**: Check that package-lock.json / yarn.lock is committed and matches package.json.

If any check fails, report what failed and fix it. Re-run checks after fixes.

### Step 2: Stage and Commit

1. Run `git status` and `git diff` to review all changes.
2. Stage the appropriate files (prefer specific files over `git add .`).
3. Write a clear commit message that explains WHY, not just WHAT.
4. Create the commit.
5. Show the user the commit hash and message for confirmation.

### Step 3: Push to Remote

1. Check which branch we're on and whether it tracks a remote.
2. Confirm with the user before pushing, especially if pushing to main/master.
3. Push with `-u` flag if needed to set upstream.
4. Report success or failure.

### Step 4: Deploy (if applicable)

1. Detect deployment target:
   - Vercel: Check for vercel.json or .vercel directory
   - npm: Check if package.json has `"private": false` or publishConfig
   - Other: Check for deployment scripts in package.json
2. If deployment target found, ask the user if they want to deploy.
3. Run the deployment command.
4. Wait for deployment to complete.

### Step 5: Verify

1. If deployed to Vercel: Check deployment status, grab the URL, verify it loads.
2. If published to npm: Verify the package is visible on npmjs.com.
3. Report final status.

## Output Format

```
## Ship Report

### Pre-Flight
- Secrets scan: PASS
- Console.logs: PASS (removed 3)
- Build: PASS
- Types: PASS
- Lint: PASS
- Tests: PASS (12/12)
- Merge conflicts: PASS
- Dependencies: PASS

### Commit
- Hash: abc1234
- Message: "Add EU AI Act risk classification endpoint"
- Files: 4 changed, 2 added

### Push
- Branch: feature/risk-classification
- Remote: origin
- Status: PUSHED

### Deploy
- Target: Vercel
- Status: DEPLOYED
- URL: https://project.vercel.app
- Build time: 45s

### Verify
- Site loads: YES
- No errors in console: YES
```

## Rules

- ALWAYS ask before pushing to main/master. Warn that this is the production branch.
- NEVER use `--force` push unless the user explicitly requests it.
- NEVER use `--no-verify` to skip hooks unless the user explicitly requests it.
- If the build fails, fix the issue and re-run. Do not skip.
- If there are no changes to commit, say so and stop.
- Include "Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>" in commit messages.
- Stage specific files, not `git add .`, to avoid accidentally committing sensitive files.
