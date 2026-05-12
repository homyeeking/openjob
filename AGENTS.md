<claude-mem-context>
# Memory Context

# [jobs] recent context, 2026-05-11 3:54pm GMT+8

No previous sessions found.
</claude-mem-context>

# Project Instructions

- Keep the npm registry configuration in the repository root `.npmrc`.
- Use `pnpm` for JavaScript package management in this repository.
- The `jobs` npm package lives under `cli/`; run package commands from `cli/`, for example `pnpm install`, `pnpm pack --dry-run`, and `pnpm publish`.
- Do not add or update `package-lock.json`; use `pnpm-lock.yaml` instead.
- When updating `README.md`, also sync the corresponding changes to `README.zh.md` and `AGENTS.md`.
- In user-facing docs, prefer CLI examples in the form `npx @homy/jobs@latest <command>`.
