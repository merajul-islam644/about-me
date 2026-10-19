// Renders text with `**accent**` spans, producing exactly the same DOM the
// original hardcoded JSX produced: plain text nodes alternating with
// <span className={accentClass}>…</span>. No HTML injection anywhere.

export const AccentText = ({ text, accentClass }) => {
  // String.split with a capture group alternates: even indices are plain
  // text, odd indices are the marked accent content.
  const parts = String(text ?? "").split(/\*\*(.+?)\*\*/g);
  return parts.map((part, index) =>
    index % 2 === 1 ? (
      <span key={index} className={accentClass}>
        {part}
      </span>
    ) : (
      part
    )
  );
};
