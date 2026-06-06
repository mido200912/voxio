export default function Badge({ className = "", children, ...props }) {
  return (
    <span
      className={`inline-flex items-center gap-2 px-5 py-2 bg-[var(--color-card-bg)] border border-[var(--color-border)] rounded-full text-sm font-semibold uppercase tracking-wider ${className}`}
      {...props}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-text)] animate-pulse" />
      {children}
    </span>
  );
}
