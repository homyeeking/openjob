interface CronBadgeProps {
  cron: string;
  label?: string;
  className?: string;
}

export default function CronBadge({ cron, label, className = '' }: CronBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 bg-cron-bg text-cron-text font-mono text-xs rounded-full ${className}`}
      title={cron}
    >
      ∪ {label || cron}
    </span>
  );
}
