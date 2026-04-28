---
name: npm-global-update
cron: 0 9 * * 1
description: Update npm global dependencies every Monday at 9 AM
tags: [maintenance, npm]
timeout: 30
---

# npm Global Dependencies Update

## Objective

Automatically update installed npm global packages every Monday to keep the development environment up to date.

## Execution Steps

1. Check current npm global installation list
   ```bash
   npm list -g --depth=0
   ```

2. Execute global update
   ```bash
   npm update -g
   ```

3. Verify update results
   - Run `npm list -g --depth=0` again for comparison
   - Check for any errors

## Output Requirements

Record the following information:
- Version list before update
- Version list after update
- Any warnings or error messages

## Notes

- If certain packages need to stay at specific versions, check and skip them first
- Record specific errors when update fails, don't affect subsequent execution
- If there are major version bumps, mark and record them separately
