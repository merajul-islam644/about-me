// The CV document body — renders under the hero on /cv. Generic on purpose:
// every profession's sections flow through the same three shapes (entry /
// list / text), and the section title carries the profession's own wording.

const EntryItem = ({ item }) => (
  <article className="rounded-xl border border-white/5 bg-gray-800/60 p-4">
    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
      <h4 className="font-semibold text-white">{item.heading}</h4>
      {item.period && (
        <span className="text-xs font-medium tracking-wide text-sky-300/80">
          {item.period}
        </span>
      )}
    </div>
    {item.sub && <p className="mt-0.5 text-sm text-sky-300">{item.sub}</p>}
    {item.details && (
      <p className="mt-2 text-sm leading-relaxed whitespace-pre-line text-gray-300">
        {item.details}
      </p>
    )}
  </article>
);

export const CvDocument = ({ sections }) => {
  if (!sections?.length) return null;
  return (
    <div className="w-full max-w-3xl mx-auto flex flex-col gap-5 px-6 pb-16">
      {sections.map((section) => (
        <section
          key={section.id}
          className="rounded-2xl border border-white/10 bg-gray-900/60 p-5 md:p-6"
        >
          <h3 className="text-lg font-bold text-sky-300">{section.title}</h3>
          <div className="mt-3 flex flex-col gap-3">
            {section.type === "entry" &&
              section.items.map((item) => (
                <EntryItem key={item.id} item={item} />
              ))}
            {section.type === "list" && (
              <ul className="flex flex-wrap gap-2">
                {section.items.map((item) => (
                  <li
                    key={item.id}
                    className="rounded-full border border-white/10 bg-gray-800 px-3 py-1 text-sm text-gray-200"
                  >
                    {item.text}
                  </li>
                ))}
              </ul>
            )}
            {section.type === "text" &&
              section.items.map((item) => (
                <p
                  key={item.id}
                  className="text-sm leading-relaxed whitespace-pre-line text-gray-300"
                >
                  {item.text}
                </p>
              ))}
            {section.items.length === 0 && (
              <p className="text-sm italic text-gray-500">
                Nothing here yet — add it from Edit CV.
              </p>
            )}
          </div>
        </section>
      ))}
    </div>
  );
};

export default CvDocument;
