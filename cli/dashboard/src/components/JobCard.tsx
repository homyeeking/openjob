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
      className="grid grid-cols-[60px_1fr_auto] items-center gap-5 px-6 py-5 bg-bg-card border border-border rounded-xl transition-all duration-200 hover:border-border-hover hover:bg-bg-card-hover cursor-pointer no-underline hover:no-underline"
    >
      <div className="font-mono text-xl font-bold text-text-tertiary text-center">
        #{job.rank}
      </div>
      <div className="min-w-0">
        <div className="text-base font-semibold mb-1 text-text-primary">{job.name}</div>
        <div className="text-sm text-text-secondary mb-2.5 overflow-hidden text-ellipsis" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
          {job.desc}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <CronBadge cron={job.cron} label={job.cronLabel} />
          {job.timeout && <TimeoutBadge>{job.timeout}min</TimeoutBadge>}
          {job.tags.map(t => <Tag key={t}>{t}</Tag>)}
        </div>
      </div>
      <div className="text-right whitespace-nowrap">
        <div className="text-xl font-bold text-text-primary">{job.installs}</div>
        <div className="text-xs text-text-tertiary">installs</div>
      </div>
    </Link>
  );
}
