export default function SectionHead({
  eyebrow,
  title,
  description,
  center = false,
  dark = false,
  className = "",
}: {
  eyebrow: string;
  title: string;
  description?: string;
  center?: boolean;
  dark?: boolean;
  className?: string;
}) {
  return (
    <div
      className={`max-w-xl mb-14 ${center ? "mx-auto text-center" : ""} ${className}`}
    >
      <span className="font-script text-3xl md:text-4xl text-gold-deep block leading-none mb-1">
        {eyebrow}
      </span>
      <h2
        className={`font-display font-semibold text-3xl md:text-4xl ${
          dark ? "text-sand" : "text-green-deep"
        }`}
      >
        {title}
      </h2>
      {description && (
        <p className={`mt-4 ${dark ? "text-granite-light" : "text-ink-soft"}`}>
          {description}
        </p>
      )}
    </div>
  );
}
