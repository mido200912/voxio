export default function Container({ className = "", children, as: Tag = "div", ...props }) {
  return (
    <Tag className={`max-w-[1200px] mx-auto px-8 max-md:px-4 ${className}`} {...props}>
      {children}
    </Tag>
  );
}
