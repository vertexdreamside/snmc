export default function FrondDivider() {
  return (
    <div className="flex items-center justify-center gap-4 mb-11">
      <span className="flex-1 max-w-[120px] h-px bg-gradient-to-r from-transparent to-granite-light" />
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.4}
        className="w-8 h-8 shrink-0 text-gold-deep"
      >
        <path d="M12 22V9M12 9c0-4 3-7 7-7-1 4-4 6-7 7Zm0 0C12 5 9 2 5 2c1 4 4 6 7 7Zm0 4c2-2 6-2 8 0-2 2-6 3-8 0Zm0 0c-2-2-6-2-8 0 2 2 6 3 8 0Z" />
      </svg>
      <span className="flex-1 max-w-[120px] h-px bg-gradient-to-l from-transparent to-granite-light" />
    </div>
  );
}
