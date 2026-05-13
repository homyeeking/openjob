interface TagProps {
  children: React.ReactNode;
  className?: string;
}

export default function Tag({ children, className = '' }: TagProps) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 bg-tag-bg text-tag-text text-xs font-medium rounded-full ${className}`}>
      {children}
    </span>
  );
}
