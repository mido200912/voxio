const variants = {
  primary: "bg-[var(--color-text)] text-[var(--color-bg)] shadow-[0_4px_14px_rgba(var(--color-text-rgb),0.12)] hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(var(--color-text-rgb),0.18)]",
  secondary: "bg-transparent text-[var(--color-text)] border-2 border-[var(--color-border)] hover:border-[var(--color-text)] hover:-translate-y-0.5",
  outline: "bg-transparent text-[var(--color-text)] border-2 border-[var(--color-text)] hover:bg-[var(--color-text)] hover:text-[var(--color-bg)] hover:-translate-y-0.5",
  ghost: "bg-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-[var(--color-card-bg)]",
};

const sizes = {
  sm: "px-4 py-2 text-sm",
  md: "px-6 py-2.5 text-sm",
  lg: "px-8 py-3.5 text-base",
  xl: "px-10 py-4.5 text-lg",
};

export default function Button({ variant = "primary", size = "md", className = "", children, ...props }) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-xl font-semibold cursor-pointer transition-all duration-300 ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
