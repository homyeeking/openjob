<claude-mem-context>
# Memory Context

# [openjob] recent context, 2026-05-14 8:49pm GMT+8

No previous sessions found.
</claude-mem-context>

# Project Instructions

- Keep the npm registry configuration in the repository root `.npmrc`.
- Use `pnpm` for JavaScript package management in this repository.
- The `openjob` npm package lives under `cli/`; run package commands from `cli/`, for example `pnpm install`, `pnpm pack --dry-run`, and `pnpm publish`.
- Do not add or update `package-lock.json`; use `pnpm-lock.yaml` instead.
- When updating `README.md`, also sync the corresponding changes to `README.zh.md` and `AGENTS.md`.
- In user-facing docs, prefer CLI examples in the form `npx openjob@latest <command>`.
- The published CLI package uses the npm name `openjob`, and its single exposed bin is also `openjob` to avoid collisions with the shell builtin `jobs` during `npx` execution.
- The Job creation template lives at `skills/job-creator/templates/JOB.md`.
