import { useState, useEffect, useRef, useCallback } from 'react';
import { jobs, agents, parseInstalls } from '../data/jobs';
import type { Job } from '../data/jobs';
import JobCard from '../components/JobCard';
import Tag from '../components/Tag';
import CronBadge from '../components/CronBadge';
import TimeoutBadge from '../components/TimeoutBadge';
import Modal from '../components/Modal';
import Toast, { useToast } from '../components/Toast';

function Hero() {
  const handleCopy = () => {
    navigator.clipboard.writeText('openjob add <owner/repo>');
    // parent handles toast
  };

  return (
    <section className="text-center py-20 px-6 max-w-[900px] mx-auto">
      <pre className="font-mono text-accent leading-tight whitespace-pre mb-6" style={{ fontSize: 'clamp(24px, 5vw, 48px)', textShadow: '0 0 40px #00d4aa22' }}>
{`  ██████╗ ██████╗ ███████╗███╗   ██╗     ██╗ ██████╗ ██████╗
 ██╔═══██╗██╔══██╗██╔════╝████╗  ██║     ██║██╔═══██╗██╔══██╗
 ██║   ██║██████╔╝█████╗  ██╔██╗ ██║     ██║██║   ██║██████╔╝
 ██║   ██║██╔═══╝ ██╔══╝  ██║╚██╗██║██   ██║██║   ██║██╔══██╗
 ╚██████╔╝██║     ███████╗██║ ╚████║╚█████╔╝╚██████╔╝██████╔╝
  ╚═════╝ ╚═╝     ╚══════╝╚═╝  ╚═══╝ ╚════╝  ╚═════╝ ╚═════╝`}
      </pre>
      <h1
        className="font-bold mb-4"
        style={{
          fontSize: 'clamp(28px, 4vw, 44px)',
          background: 'linear-gradient(135deg, #ededed, #888888)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}
      >
        The Open Agent Jobs Ecosystem
      </h1>
      <p className="text-lg text-text-secondary max-w-[640px] mx-auto mb-8">
        Scheduled tasks that run outside the Agent Loop. Let AI work for you while you sleep &mdash; cron-powered, condition-driven, fully autonomous.
      </p>
      <div
        onClick={handleCopy}
        className="inline-flex items-center gap-3 bg-bg-card border border-border rounded-lg px-6 py-3.5 font-mono text-sm text-text-primary cursor-pointer transition-border hover:border-accent"
      >
        <span className="text-accent">$</span>
        <span>openjob add &lt;owner/repo&gt;</span>
        <span className="text-text-tertiary text-xs font-sans">click to copy</span>
      </div>
    </section>
  );
}

function Marquee() {
  const items = [...agents, ...agents];
  return (
    <section className="py-6 overflow-hidden border-y border-border">
      <div className="text-center text-xs uppercase tracking-widest text-text-tertiary mb-4">
        Works with your favorite AI agents
      </div>
      <div className="flex w-max animate-[marquee_30s_linear_infinite] hover:[animation-play-state:paused]">
        {items.map((a, i) => (
          <div
            key={i}
            className="flex items-center gap-2 px-5 py-2 mx-2 bg-bg-card border border-border rounded-full text-sm font-medium text-text-secondary whitespace-nowrap transition-all hover:border-border-hover hover:text-text-primary"
          >
            <span className="w-2 h-2 rounded-full bg-accent" />
            {a}
          </div>
        ))}
      </div>
    </section>
  );
}

function StatsBar() {
  const [counts, setCounts] = useState({ installs: 0, jobs: 0, categories: 0, agents: 0 });
  const ref = useRef<HTMLDivElement>(null);
  const animated = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !animated.current) {
          animated.current = true;
          const targets = { installs: 37.9, jobs: 8, categories: 4, agents: 15 };
          const duration = 1200;
          const start = performance.now();

          function tick(now: number) {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setCounts({
              installs: +(targets.installs * eased).toFixed(1),
              jobs: Math.round(targets.jobs * eased),
              categories: Math.round(targets.categories * eased),
              agents: Math.round(targets.agents * eased),
            });
            if (progress < 1) requestAnimationFrame(tick);
          }
          requestAnimationFrame(tick);
        }
      },
      { threshold: 0.5 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={ref} className="flex justify-center gap-12 py-10 px-6 border-b border-border flex-wrap">
      <div className="text-center">
        <div className="font-mono text-4xl font-bold text-accent">{counts.installs}K</div>
        <div className="text-xs text-text-tertiary mt-1">Total Installs</div>
      </div>
      <div className="text-center">
        <div className="font-mono text-4xl font-bold text-accent">{counts.jobs}</div>
        <div className="text-xs text-text-tertiary mt-1">Jobs Available</div>
      </div>
      <div className="text-center">
        <div className="font-mono text-4xl font-bold text-accent">{counts.categories}</div>
        <div className="text-xs text-text-tertiary mt-1">Categories</div>
      </div>
      <div className="text-center">
        <div className="font-mono text-4xl font-bold text-accent">{counts.agents}</div>
        <div className="text-xs text-text-tertiary mt-1">Agent Integrations</div>
      </div>
    </section>
  );
}

function ExecutionFlow() {
  const steps = [
    { icon: '⏰', label: 'Cron Check' },
    { icon: '✓', label: 'Condition' },
    { icon: '📄', label: 'Load Context' },
    { icon: '⚡', label: 'Execute' },
    { icon: '📝', label: 'Log Result' },
  ];

  return (
    <section className="py-10 px-6">
      <div className="max-w-[960px] mx-auto">
        <h2 className="text-center text-2xl font-bold mb-3">Execution Flow</h2>
        <p className="text-center text-text-secondary mb-12">How a Job runs from trigger to completion</p>
        <div className="flex items-center justify-center gap-0 flex-wrap">
          {steps.map((s, i) => (
            <div key={i} className="contents">
              <div className="flex flex-col items-center px-3 py-4 bg-bg border border-border rounded-lg min-w-[100px]">
                <div className="text-xl mb-1.5">{s.icon}</div>
                <div className="text-[11px] font-semibold uppercase tracking-wider text-text-secondary">{s.label}</div>
              </div>
              {i < steps.length - 1 && <div className="text-text-tertiary text-lg px-2">&rarr;</div>}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    { num: '01', title: 'Create a Job', desc: 'Add a folder with a JOB.md file. Define the cron schedule, conditions, and instructions in Markdown.' },
    { num: '02', title: 'Schedule Triggers', desc: 'The scheduler checks your cron expression and evaluates conditions. Jobs only run when the time is right.' },
    { num: '03', title: 'AI Executes', desc: 'Claude reads your instructions, composes Skills, and executes the task autonomously. Results are logged and committed.' },
  ];

  return (
    <section className="py-20" id="how-it-works">
      <div className="max-w-[960px] mx-auto px-6">
        <h2 className="text-center text-2xl font-bold mb-3">How It Works</h2>
        <p className="text-center text-text-secondary mb-12">Three steps to autonomous AI-powered automation</p>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-5">
          {steps.map((s) => (
            <div key={s.num} className="p-7 bg-bg-card border border-border rounded-xl">
              <div className="font-mono text-4xl font-bold text-accent mb-3">{s.num}</div>
              <h3 className="text-base font-semibold mb-2">{s.title}</h3>
              <p className="text-sm text-text-secondary">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Comparison() {
  const rows = [
    { aspect: 'Trigger', skill: 'Agent decision / Manual /slash', job: 'Cron schedule + Condition check' },
    { aspect: 'Lifecycle', skill: 'Bound to current Agent Loop', job: 'System-level, persists across sessions' },
    { aspect: 'Automation', skill: 'Semi-automated', job: 'Fully automated' },
    { aspect: 'Use Case', skill: 'Interactive, on-demand tasks', job: 'Recurring, scheduled, background tasks' },
    { aspect: 'Example', skill: '/commit-push', job: 'Daily news collection at 10 AM' },
  ];

  return (
    <section className="py-16 pb-20">
      <div className="max-w-[960px] mx-auto px-6">
        <h2 className="text-center text-2xl font-bold mb-3">Jobs vs Skills</h2>
        <p className="text-center text-text-secondary mb-12">Understanding when to use each</p>
        <div className="overflow-hidden rounded-xl border border-border bg-bg-card">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-text-secondary bg-[#0f0f0f] border-b border-border">Aspect</th>
                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-text-secondary bg-[#0f0f0f] border-b border-border">Skills (In Loop)</th>
                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-text-secondary bg-[#0f0f0f] border-b border-border text-accent-text">Jobs (Out of Loop)</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.aspect}>
                  <td className="px-5 py-4 text-sm border-b border-border font-semibold">{r.aspect}</td>
                  <td className="px-5 py-4 text-sm border-b border-border">{r.skill}</td>
                  <td className="px-5 py-4 text-sm border-b border-border text-accent-text font-semibold">{r.job}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

function Spec() {
  const cards = [
    { icon: '{ }', title: 'Frontmatter', desc: 'YAML frontmatter defines metadata: name, cron, description, condition, tags, timeout, retry, and allowedSkills.' },
    { icon: '*', title: 'Cron Expressions', desc: 'Standard 5-field cron format. Supports *, comma, -, and /step operators for flexible scheduling.' },
    { icon: '?', title: 'Conditions', desc: 'Optional execution gates. Use a script path (exit code 0 = proceed) or natural language for AI-evaluated conditions.' },
    { icon: '#', title: 'Markdown Body', desc: 'After frontmatter, write instructions in Markdown. Define objectives, steps, output requirements, and safety notes for the AI.' },
    { icon: '→', title: 'Execution Flow', desc: 'Schedule check → Condition evaluation → Context loading → Task execution → Result feedback with structured logging.' },
    { icon: '◊', title: 'Best Practices', desc: 'Keep jobs idempotent, single-purpose, and under 30 minutes. Use environment variables for secrets. Track execution state.' },
  ];

  return (
    <section className="py-16 pb-20 border-t border-border" id="spec">
      <div className="max-w-[960px] mx-auto px-6">
        <h2 className="text-center text-2xl font-bold mb-3">Specification</h2>
        <p className="text-center text-text-secondary mb-12">Everything you need to know to create your own Jobs</p>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-5">
          {cards.map((c) => (
            <div key={c.title} className="p-7 bg-bg-card border border-border rounded-xl">
              <h3 className="text-base font-semibold mb-3 flex items-center gap-2">
                <span className="inline-flex items-center justify-center w-7 h-7 bg-accent-dim rounded-md text-sm">{c.icon}</span>
                {c.title}
              </h3>
              <p className="text-sm text-text-secondary">{c.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section className="py-20 px-6 text-center border-t border-border">
      <h2 className="text-2xl font-bold mb-3">Create Your Own Job</h2>
      <p className="text-text-secondary max-w-[520px] mx-auto mb-8 text-base">
        Have an idea for an automated task? Jobs are just Markdown files with a cron schedule. Share yours with the community.
      </p>
      <div className="flex justify-center gap-4 flex-wrap">
        <a href="template/JOB.md" className="inline-flex items-center gap-2 px-7 py-3.5 bg-accent text-black text-sm font-semibold rounded-lg transition-opacity hover:opacity-85 hover:no-underline">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>
          Use Template
        </a>
        <a href="spec/jobs-spec.md" className="inline-flex items-center gap-2 px-7 py-3.5 bg-transparent border border-border text-text-primary text-sm font-semibold rounded-lg transition-border hover:border-border-hover hover:no-underline">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
          Read Spec
        </a>
        <a href="https://github.com/HomyeeKing/openjob" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-7 py-3.5 bg-transparent border border-border text-text-primary text-sm font-semibold rounded-lg transition-border hover:border-border-hover hover:no-underline">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
          GitHub
        </a>
      </div>
    </section>
  );
}

export default function HomePage() {
  const [currentFilter, setCurrentFilter] = useState('all');
  const [currentSearch, setCurrentSearch] = useState('');
  const [currentSort, setCurrentSort] = useState('rank');
  const [modalJob, setModalJob] = useState<Job | null>(null);
  const { toast, showToast, hideToast } = useToast();
  const searchRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut "/" to focus search
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === '/' && !e.ctrlKey && !e.metaKey && document.activeElement?.tagName !== 'INPUT') {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, []);

  const filtered = useCallback(() => {
    let result = jobs;
    if (currentFilter !== 'all') {
      result = result.filter(j => j.category === currentFilter);
    }
    if (currentSearch) {
      const q = currentSearch.toLowerCase();
      result = result.filter(j =>
        j.name.includes(q) || j.desc.toLowerCase().includes(q) || j.tags.some(t => t.includes(q))
      );
    }
    return [...result].sort((a, b) => {
      switch (currentSort) {
        case 'installs': return parseInstalls(b.installs) - parseInstalls(a.installs);
        case 'name': return a.name.localeCompare(b.name);
        case 'timeout': return (b.timeout || 0) - (a.timeout || 0);
        default: return a.rank - b.rank;
      }
    });
  }, [currentFilter, currentSearch, currentSort]);

  const handleCopyInstall = useCallback((name: string) => {
    navigator.clipboard.writeText(`openjob add HomyeeKing/openjob/${name}`);
    showToast('Copied to clipboard');
  }, [showToast]);

  const filteredJobs = filtered();

  return (
    <>
      <Hero />
      <Marquee />
      <StatsBar />

      {/* Leaderboard */}
      <div className="max-w-[960px] mx-auto px-6" id="leaderboard">
        <div className="flex items-center justify-between flex-wrap gap-4 py-12 pb-6">
          <h2 className="text-xl font-bold">Job Leaderboard</h2>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex gap-1 bg-bg-card border border-border rounded-lg p-1">
              {['all', 'automation', 'monitoring', 'maintenance'].map(f => (
                <button
                  key={f}
                  onClick={() => setCurrentFilter(f)}
                  className={`px-4 py-2 rounded-md text-xs font-medium border-none cursor-pointer transition-all ${
                    currentFilter === f
                      ? 'bg-border text-text-primary'
                      : 'bg-transparent text-text-secondary hover:text-text-primary'
                  }`}
                >
                  {f === 'all' ? 'All Jobs' : f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
            <select
              value={currentSort}
              onChange={e => setCurrentSort(e.target.value)}
              className="appearance-none bg-bg-card border border-border rounded-md px-8 py-2 text-xs font-medium text-text-secondary cursor-pointer transition-border hover:border-border-hover focus:outline-none focus:border-accent"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L5 5L9 1' stroke='%23888' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 10px center',
              }}
            >
              <option value="rank">Sort: Rank</option>
              <option value="installs">Sort: Installs</option>
              <option value="name">Sort: Name</option>
              <option value="timeout">Sort: Duration</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-bg-card border border-border rounded-lg px-4 py-3 mb-8 transition-border focus-within:border-accent">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-text-tertiary shrink-0">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
          <input
            ref={searchRef}
            type="text"
            value={currentSearch}
            onChange={e => setCurrentSearch(e.target.value)}
            placeholder="Search jobs by name, description, or tag..."
            className="flex-1 bg-transparent border-none outline-none text-text-primary text-sm font-sans placeholder:text-text-tertiary"
          />
          <span className="inline-flex items-center justify-center min-w-6 h-6 px-1.5 bg-bg border border-border rounded text-xs font-mono text-text-tertiary shrink-0">/</span>
        </div>

        <div className="flex flex-col gap-3 pb-20">
          {filteredJobs.length === 0 ? (
            <div className="text-center py-16 text-text-tertiary">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mx-auto mb-4 opacity-40">
                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /><path d="M8 11h6" />
              </svg>
              <div className="text-base mb-1">No jobs found</div>
              <div className="text-sm">Try a different search term or filter</div>
            </div>
          ) : (
            filteredJobs.map(job => <JobCard key={job.name} job={job} />)
          )}
        </div>
      </div>

      <ExecutionFlow />
      <HowItWorks />
      <Comparison />
      <Spec />
      <CTA />

      {/* Modal for quick preview */}
      <Modal
        open={!!modalJob}
        onClose={() => setModalJob(null)}
        title={modalJob?.name || ''}
        footer={modalJob ? (
          <>
            <div
              onClick={() => handleCopyInstall(modalJob.name)}
              className="inline-flex items-center gap-2 font-mono text-xs text-text-secondary bg-bg px-3.5 py-2 rounded-md cursor-pointer transition-border border border-border hover:border-accent"
            >
              <span className="text-accent">$</span> openjob add ... <span className="text-text-tertiary text-[11px] font-sans">copy</span>
            </div>
            <a href={`jobs/${modalJob.name}/JOB.md`} className="inline-flex items-center px-4 py-2 bg-accent text-black text-xs font-semibold rounded-md transition-opacity hover:opacity-85 hover:no-underline">
              View Source
            </a>
          </>
        ) : undefined}
      >
        {modalJob && (
          <>
            <div className="mb-5">
              <div className="text-[11px] font-semibold uppercase tracking-widest text-text-tertiary mb-2">Description</div>
              <div className="text-sm text-text-primary leading-relaxed">{modalJob.fullDesc || modalJob.desc}</div>
            </div>
            <div className="mb-5">
              <div className="text-[11px] font-semibold uppercase tracking-widest text-text-tertiary mb-2">Schedule</div>
              <div className="flex flex-wrap gap-2">
                <CronBadge cron={modalJob.cron} />
                <CronBadge cron={modalJob.cron} label={modalJob.cronLabel} className="!bg-[#1a2a1a] !text-[#88cc88]" />
                {modalJob.timeout && <TimeoutBadge>{modalJob.timeout}min timeout</TimeoutBadge>}
                {modalJob.retry ? <TimeoutBadge variant="retry">{modalJob.retry}x retry</TimeoutBadge> : null}
              </div>
            </div>
            {modalJob.condition && (
              <div className="mb-5">
                <div className="text-[11px] font-semibold uppercase tracking-widest text-text-tertiary mb-2">Condition</div>
                <div className="font-mono text-xs bg-bg border border-border rounded-lg px-4 py-4 text-text-primary whitespace-pre leading-relaxed overflow-x-auto">{modalJob.condition}</div>
              </div>
            )}
            <div className="mb-5">
              <div className="text-[11px] font-semibold uppercase tracking-widest text-text-tertiary mb-2">Execution Steps</div>
              <div className="font-mono text-xs bg-bg border border-border rounded-lg px-4 py-4 text-text-primary whitespace-pre leading-relaxed overflow-x-auto">
                {modalJob.steps.map((s, i) => `${i + 1}. ${s}`).join('\n')}
              </div>
            </div>
            {modalJob.allowedSkills.length > 0 && (
              <div className="mb-5">
                <div className="text-[11px] font-semibold uppercase tracking-widest text-text-tertiary mb-2">Allowed Skills</div>
                <div className="flex flex-wrap gap-2">{modalJob.allowedSkills.map(s => <Tag key={s}>{s}</Tag>)}</div>
              </div>
            )}
            <div className="mb-5">
              <div className="text-[11px] font-semibold uppercase tracking-widest text-text-tertiary mb-2">Tags</div>
              <div className="flex flex-wrap gap-2">{modalJob.tags.map(t => <Tag key={t}>{t}</Tag>)}</div>
            </div>
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-widest text-text-tertiary mb-2">Install</div>
              <div className="font-mono text-xs bg-bg border border-border rounded-lg px-4 py-4 text-text-primary whitespace-pre leading-relaxed overflow-x-auto">
                openjob add HomyeeKing/openjob/{modalJob.name}
              </div>
            </div>
          </>
        )}
      </Modal>

      <Toast message={toast.message} show={toast.show} onHide={hideToast} />
    </>
  );
}
