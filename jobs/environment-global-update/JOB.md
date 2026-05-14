---
name: environment-global-update
cron: 0 9 * * 1
description: Update npm global dependencies, Homebrew packages, and global skills every Monday at 9 AM
tags: [maintenance, npm, homebrew, skills]
timeout: 30
---

# Environment Global Dependencies Update

## Objective

Automatically update installed npm global packages, Homebrew packages, and global skills every Monday to keep the development environment up to date. All commands must run in non-interactive mode.

## Execution Steps

1. Check current npm global installation list
   ```bash
   npm list -g --depth=0
   ```

2. Execute npm global update in non-interactive mode
   ```bash
   npm update -g
   ```

3. Check current Homebrew package status
   ```bash
   brew outdated
   ```

4. Update Homebrew formulae metadata in non-interactive mode
   ```bash
   HOMEBREW_NO_ENV_HINTS=1 brew update --quiet
   ```

5. Upgrade all outdated Homebrew dependencies in non-interactive mode
   ```bash
   HOMEBREW_NO_ENV_HINTS=1 brew upgrade
   ```

6. Update global skills in non-interactive mode
   ```bash
   npx skills@latest update -y -g
   ```

7. Verify update results
   - Run `npm list -g --depth=0` again for comparison
   - Run `brew outdated` again to verify no pending upgrades remain
   - Optionally run `npm list -g --depth=0 | grep skills` or equivalent if verification is needed
   - Check for any errors

## Output Requirements

Record the following information:
- Version list before update
- Version list after update
- Homebrew outdated list before update
- Homebrew outdated list after update
- Global skills update result
- Any warnings or error messages

## Notes

- If certain packages need to stay at specific versions, check and skip them first
- Record specific errors when update fails, don't affect subsequent execution
- If there are major version bumps, mark and record them separately
- All commands should avoid interactive prompts; prefer explicit non-interactive flags or environment variables when available
