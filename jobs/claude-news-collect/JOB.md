---
name: claude-news-collect
cron: 0 10 * * *
description: Collect Claude updates daily, summarize and publish to blog if there are updates
condition: Check if there are new updates from Claude official channels
allowedSkills: [write-to-blog]
tags: [monitoring, claude, blog]
timeout: 60
---

# Claude Update Collector

## Objective

Check Claude-related official updates daily. If there is new content, summarize and publish to personal blog.

## Execution Steps

### Phase 1: Information Collection

Check the following sources for new content:

1. **Anthropic Official Blog**
   - https://www.anthropic.com/news
   - Look for new articles within the last 24 hours

2. **Claude Documentation Updates**
   - https://docs.anthropic.com
   - Check changelogs, release notes

3. **GitHub Releases**
   - Updates to related SDKs and tools

### Phase 2: Content Summary

If new content is found:

1. Read and understand the updates
2. Extract key points:
   - New features
   - Important improvements
   - Breaking changes
   - New APIs or parameters

3. Write a structured summary article including:
   - Update overview
   - Detailed explanation of core changes
   - Practical application scenarios
   - Migration recommendations (if there are breaking changes)

### Phase 3: Publish

Use `write-to-blog` skill to publish the summary article to personal blog.

## Output Requirements

- If updates exist: publish a blog article
- If no updates: record "No updates today" and exit
- All execution situations should be logged

## Notes

- Only process truly "new" content, avoid duplicate publishing
- Summaries should accurately convey official information, don't add speculation
- If updates involve security issues, emphasize them specifically
- Include links to official sources

## Condition Examples

- Official blog has new article → trigger
- Documentation has important updates → trigger
- Only minor typo fixes → may skip
