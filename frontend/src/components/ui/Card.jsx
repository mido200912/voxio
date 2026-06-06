export default function Card({ className = "", children, hover = false, ...props }) {
  return (
    <div
      className={`bg-[var(--color-card-bg)] border border-[var(--color-border)] rounded-2xl transition-all duration-300 ${
        hover ? "hover:shadow-[0_8px_30px_var(--color-shadow-hover)] hover:-translate-y-1" : "shadow-[0_2px_20px_var(--color-shadow)]"
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
