interface TagProps {
  label: string;
  className?: string;
}

export default function Tag({ label, className = 'bg-green/10 text-green' }: TagProps) {
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-mono uppercase tracking-wider ${className}`}>
      {label}
    </span>
  );
}
