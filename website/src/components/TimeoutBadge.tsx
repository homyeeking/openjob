interface TimeoutBadgeProps {
  children: React.ReactNode;
  variant?: 'timeout' | 'retry';
  className?: string;
}

export default function TimeoutBadge({ children, variant = 'timeout', className = '' }: TimeoutBadgeProps) {
  const bg = variant === 'retry' ? 'bg-[#2a1a2a] text-[#cc88cc]' : 'bg-[#2a2a1a] text-warn';
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 ${bg} text-xs rounded-full ${className}`}>
      {children}
    </span>
  );
}
