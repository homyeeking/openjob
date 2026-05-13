export default function Footer() {
  return (
    <footer className="border-t border-border py-12 px-10">
      <div className="max-w-[960px] mx-auto grid grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-8">
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-text-secondary mb-4">Browse</h4>
          <a href="#leaderboard" className="block text-sm text-text-tertiary mb-2.5 transition-colors hover:text-text-primary hover:no-underline">All Jobs</a>
          <a href="#leaderboard" className="block text-sm text-text-tertiary mb-2.5 transition-colors hover:text-text-primary hover:no-underline">Automation</a>
          <a href="#leaderboard" className="block text-sm text-text-tertiary mb-2.5 transition-colors hover:text-text-primary hover:no-underline">Monitoring</a>
          <a href="#leaderboard" className="block text-sm text-text-tertiary mb-2.5 transition-colors hover:text-text-primary hover:no-underline">Maintenance</a>
        </div>
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-text-secondary mb-4">Resources</h4>
          <a href="spec/jobs-spec.md" className="block text-sm text-text-tertiary mb-2.5 transition-colors hover:text-text-primary hover:no-underline">Specification</a>
          <a href="template/JOB.md" className="block text-sm text-text-tertiary mb-2.5 transition-colors hover:text-text-primary hover:no-underline">Template</a>
          <a href="jobs/" className="block text-sm text-text-tertiary mb-2.5 transition-colors hover:text-text-primary hover:no-underline">Example Jobs</a>
        </div>
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-text-secondary mb-4">Agents</h4>
          <a href="#" className="block text-sm text-text-tertiary mb-2.5 transition-colors hover:text-text-primary hover:no-underline">Claude Code</a>
          <a href="#" className="block text-sm text-text-tertiary mb-2.5 transition-colors hover:text-text-primary hover:no-underline">Cursor</a>
          <a href="#" className="block text-sm text-text-tertiary mb-2.5 transition-colors hover:text-text-primary hover:no-underline">Codex</a>
          <a href="#" className="block text-sm text-text-tertiary mb-2.5 transition-colors hover:text-text-primary hover:no-underline">Gemini</a>
        </div>
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-text-secondary mb-4">Project</h4>
          <a href="https://github.com/HomyeeKing/openjob" className="block text-sm text-text-tertiary mb-2.5 transition-colors hover:text-text-primary hover:no-underline">GitHub</a>
          <a href="https://homyzone.pages.dev/blogs/aigc/jobs-over-skills" className="block text-sm text-text-tertiary mb-2.5 transition-colors hover:text-text-primary hover:no-underline">Blog Post</a>
        </div>
      </div>
      <div className="max-w-[960px] mx-auto mt-8 pt-6 border-t border-border text-xs text-text-tertiary text-center">
        Jobs &mdash; Out of Loop Scheduled Tasks for AI Agents. Open source on GitHub.
      </div>
    </footer>
  );
}
