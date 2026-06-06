export default function SectionHeader({ badge, title, description, className = "", align = "center" }) {
  const alignClasses = {
    center: "text-center",
    left: "text-left",
    right: "text-right",
  };

  return (
    <div className={`mb-16 ${alignClasses[align]} ${className}`}>
      {badge && (
        <span className="inline-flex items-center gap-2 px-5 py-2 bg-[var(--color-card-bg)] border border-[var(--color-border)] rounded-full text-sm font-semibold uppercase tracking-wider mb-4">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-text)] animate-pulse" />
          {badge}
        </span>
      )}
      {title && (
        <h2 className="text-[clamp(2rem,4vw,3rem)] font-bold leading-tight mb-4">
          {title}
        </h2>
      )}
      {description && (
        <p className="text-lg text-[var(--color-text-secondary)] max-w-[600px] mx-auto">
          {description}
        </p>
      )}
    </div>
  );
}
