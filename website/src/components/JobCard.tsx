import { Link } from 'react-router-dom';
import type { Job } from '../data/jobs';
import CronBadge from './CronBadge';
import TimeoutBadge from './TimeoutBadge';
import Tag from './Tag';

interface JobCardProps {
  job: Job;
}

export default function JobCard({ job }: JobCardProps) {
  return (
    <Link
      to={`/job/${job.name}`}
      className="group grid gap-5 rounded-2xl border border-border bg-bg-card/90 px-6 py-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-accent/50 hover:bg-bg-card-hover hover:shadow-[0_22px_60px_-32px_rgba(0,212,170,0.45)] md:grid-cols-[72px_minmax(0,1fr)_auto] md:items-center no-underline hover:no-underline"
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-black/30 font-mono text-lg font-bold text-text-tertiary transition-colors group-hover:border-accent/40 group-hover:text-accent md:h-16 md:w-16 md:text-xl">
        #{job.rank}
      </div>
      <div className="min-w-0">
        <div className="mb-1.5 flex flex-wrap items-center gap-2">
          <div className="text-base font-semibold text-text-primary md:text-lg">{job.name}</div>
          <span className="rounded-full border border-accent/20 bg-accent/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-accent">
            {job.category}
          </span>
        </div>
        <div className="mb-3 overflow-hidden text-ellipsis text-sm text-text-secondary" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
          {job.desc}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <CronBadge cron={job.cron} label={job.cronLabel} />
          {job.timeout && <TimeoutBadge>{job.timeout}min</TimeoutBadge>}
          {job.tags.slice(0, 3).map(t => <Tag key={t}>{t}</Tag>)}
        </div>
      </div>
      <div className="flex items-center justify-between gap-4 md:block md:text-right">
        <div>
          <div className="text-xl font-bold text-text-primary">{job.installs}</div>
          <div className="text-xs text-text-tertiary">installs</div>
        </div>
        <div className="rounded-full border border-border px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors group-hover:border-accent/40 group-hover:text-text-primary">
          View job →
        </div>
      </div>
    </Link>
  );
}
