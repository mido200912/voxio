import Container from "./Container";
import SectionHeader from "./SectionHeader";

export default function Section({
  id,
  className = "",
  children,
  badge,
  title,
  description,
  containerClassName = "",
}) {
  return (
    <section id={id} className={`py-24 max-md:py-16 ${className}`}>
      <Container className={containerClassName}>
        {(badge || title || description) && (
          <SectionHeader badge={badge} title={title} description={description} />
        )}
        {children}
      </Container>
    </section>
  );
}
