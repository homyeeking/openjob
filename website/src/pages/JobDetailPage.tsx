import { useParams, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { jobs, generatePrompt } from '../data/jobs';
import Tag from '../components/Tag';
import CronBadge from '../components/CronBadge';
import Toast, { useToast } from '../components/Toast';

export default function JobDetailPage() {
  const { name } = useParams<{ name: string }>();
  const job = jobs.find(j => j.name === name);
  const { toast, showToast, hideToast } = useToast();

  if (!job) {
    return (
      <div className="text-center py-20 px-6">
        <h1 className="text-5xl font-bold text-text-tertiary mb-3">404</h1>
        <p className="text-base text-text-secondary mb-6">Job not found. It may have been removed or the name is incorrect.</p>
        <Link to="/" className="text-accent-text">&larr; Back to all jobs</Link>
      </div>
    );
  }

  const installCmd = `openjob add HomyeeKing/openjob/${job.name}`;
  const prompt = generatePrompt(job);
  const related = jobs.filter(j => j.name !== job.name);

  const handleCopy = () => {
    navigator.clipboard.writeText(installCmd);
    showToast('Copied to clipboard');
  };

  return (
    <>
      {/* Breadcrumb */}
      <div className="max-w-[1220px] mx-auto px-6 pt-5 text-sm text-text-tertiary">
        <Link to="/" className="text-text-secondary hover:no-underline">jobs</Link>
        <span className="mx-1.5">/</span>
        <Link to={`/#${job.category}`} className="text-text-secondary hover:no-underline">{job.category}</Link>
        <span className="mx-1.5">/</span>
        {job.name}
      </div>

      {/* Detail Layout */}
      <div className="max-w-[1220px] mx-auto px-6 py-6 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_300px] gap-8">
        {/* Main */}
        <div className="min-w-0">
          <h1 className="font-mono text-3xl font-bold mb-3">{job.name}</h1>
          <div className="flex flex-wrap gap-2 mb-6">
            {job.tags.map(t => (
              <Link key={t} to={`/#${t}`} className="no-underline hover:no-underline">
                <Tag>{t}</Tag>
              </Link>
            ))}
          </div>

          <div
            onClick={handleCopy}
            className="bg-bg-card border border-border rounded-lg px-5 py-4 flex items-center justify-between cursor-pointer transition-border hover:border-accent mb-8"
          >
            <code className="font-mono text-sm text-text-primary">
              <span className="text-accent">$</span> {installCmd}
            </code>
            <span className="text-xs text-text-tertiary transition-colors hover:text-text-secondary">click to copy</span>
          </div>

          <div className="job-content bg-bg-card border border-border rounded-xl px-8 py-8 mb-8">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{job.body}</ReactMarkdown>
          </div>
        </div>

        {/* Sidebar */}
        <aside className="lg:sticky lg:top-20 lg:self-start">
          <div className="bg-bg-card border border-border rounded-xl px-6 py-6 mb-5">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-text-tertiary mb-4">Metadata</h3>
            <div className="space-y-0">
              {[
                { label: 'Installs', value: job.installs, className: 'text-accent-text' },
                { label: 'Schedule', value: job.cron, className: 'font-mono text-xs text-cron-text' },
                { label: 'Frequency', value: job.cronLabel },
                { label: 'Timeout', value: `${job.timeout} min` },
                { label: 'Retry', value: String(job.retry) },
                { label: 'Condition', value: job.condition || 'none', className: 'text-xs' },
                { label: 'Skills', value: job.allowedSkills.length ? job.allowedSkills.join(', ') : 'all', className: 'text-xs' },
                { label: 'Category', value: job.category },
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between py-2 border-b border-[#1a1a1a] last:border-b-0">
                  <span className="text-xs text-text-secondary">{row.label}</span>
                  <span className={`text-sm font-semibold text-text-primary ${row.className || ''}`}>{row.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-bg-card border border-border rounded-xl px-6 py-6">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-text-tertiary mb-4">Agent Prompt Preview</h3>
            <div className="bg-bg border border-border rounded-lg px-4 py-4 font-mono text-xs text-text-secondary leading-relaxed whitespace-pre-wrap max-h-60 overflow-y-auto">
              {prompt}
            </div>
          </div>
        </aside>
      </div>

      {/* Related Jobs */}
      <section className="max-w-[1220px] mx-auto px-6 pb-16">
        <h2 className="text-xl font-bold mb-5">More Jobs</h2>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-3">
          {related.map(j => (
            <Link
              key={j.name}
              to={`/job/${j.name}`}
              className="block p-5 bg-bg-card border border-border rounded-xl transition-all hover:border-border-hover hover:bg-bg-card-hover no-underline hover:no-underline"
            >
              <div className="font-mono text-sm font-semibold text-text-primary mb-1.5">{j.name}</div>
              <div className="text-xs text-text-secondary mb-2.5 overflow-hidden text-ellipsis" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                {j.desc}
              </div>
              <div className="flex items-center gap-2">
                <CronBadge cron={j.cron} className="!text-[11px] !px-2" />
                <span className="text-xs text-text-tertiary">{j.installs} installs</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <Toast message={toast.message} show={toast.show} onHide={hideToast} />
    </>
  );
}
