import { AccentText } from "../../content/AccentText";
import { CvDocument } from "./CvDocument";
import { accentForDesign, cvDesignTokens, parseCvDesign } from "./cvDesign";

// The Design picker's live preview: the real components (same token map,
// same CvDocument) rendering the caller's CV at a fixed width, so what the
// gallery card shows is exactly what picking delivers. Read-only — none of
// the editing affordances render because `edit` stays null. The header
// branches mirror Hero.jsx's structural ones at thumbnail scale.
export const CvMiniPreview = ({ cv, design, picture }) => {
  const t = cvDesignTokens(design);
  const { header } = parseCvDesign(design);
  if (!cv) return null;
  const contact = [
    cv.contact?.location,
    cv.contact?.phone,
    cv.contact?.email,
    cv.contact?.link,
  ].filter(Boolean);
  // Every design paints its own page tint — the card thumbnail shows the
  // page the way the real /cv would.
  const surface = t.previewSurface;
  const bio = (
    <p className={t.heroBio}>
      <AccentText
        text={cv.bio?.text}
        accentClass={accentForDesign(cv.bio?.accentClass, design)}
      />
    </p>
  );
  const skillsChips = (cv.skills?.length ?? 0) > 0 && (
    <div className="flex flex-wrap gap-2">
      {cv.skills.map((skill, index) => (
        <span
          key={index}
          className={`${skill.color} text-white px-3 py-1 rounded-full text-xs font-medium`}
        >
          {skill.name}
        </span>
      ))}
    </div>
  );

  // The headline trio, composed by the header branches below — slab wraps it
  // in its solid block, badge in its framed panel, the others keep it bare.
  const headline = (
    <>
      <p className={t.heroGreeting}>{cv.greeting}</p>
      <p className={t.heroTitle}>{cv.title}</p>
      {contact.length > 0 && <p className={t.heroContact}>{contact.join(" · ")}</p>}
    </>
  );

  if (header === "band") {
    // The token map's band classes carry width/sticky rules meant for the
    // real page — a fixed-width wrapper pins the island to the card's left
    // while the inner node keeps its own shape.
    const band = (
      <div className="w-56 shrink-0">
        <div className={t.band}>
          <img
            src={picture}
            alt=""
            className={`h-20 w-20 object-cover ${t.photoFrame}`}
          />
          {contact.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <span className={t.bandLabel}>Contact</span>
              {contact.map((part) => (
                <span key={part} className={t.bandRow}>
                  {part}
                </span>
              ))}
            </div>
          )}
          {(cv.skills?.length ?? 0) > 0 && (
            <div className="flex flex-col gap-2">
              <span className={t.bandLabel}>Skills</span>
              <div className="flex flex-wrap gap-1.5">
                {cv.skills.map((skill, index) => (
                  <span
                    key={index}
                    className={`${skill.color} text-white px-2.5 py-0.5 rounded-full text-xs font-medium`}
                  >
                    {skill.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
    const main = (
      <div className="flex min-w-0 flex-1 flex-col gap-3 p-6">
        <p className={t.heroGreeting}>{cv.greeting}</p>
        <p className={t.heroTitle}>{cv.title}</p>
        {bio}
        <CvDocument sections={cv.sections} design={design} edit={null} />
      </div>
    );
    return (
      <div className={surface}>
        {/* The one header that is a row: band island beside its main column.
            The surface is flex-col (everything else stacks), so this row
            wrapper restores the side-by-side arrangement. */}
        <div className="flex w-full items-start">
          {band}
          {main}
        </div>
      </div>
    );
  }

  if (header === "stack") {
    return (
      <div className={surface}>
        <img
          src={picture}
          alt=""
          className={`mx-auto h-16 w-16 object-cover ${t.photoFrame}`}
        />
        <div className="flex flex-col items-center gap-1 text-center">
          <p className={t.heroGreeting}>{cv.greeting}</p>
          <p className={t.heroTitle}>{cv.title}</p>
          {contact.length > 0 && (
            <p className={t.heroContact}>{contact.join(" · ")}</p>
          )}
        </div>
        <p className={`${t.heroBio} text-center`}>
          <AccentText
            text={cv.bio?.text}
            accentClass={accentForDesign(cv.bio?.accentClass, design)}
          />
        </p>
        {skillsChips}
        <CvDocument sections={cv.sections} design={design} edit={null} />
      </div>
    );
  }

  // side · slab · badge share the row arrangement: headline left, photo
  // right; the slab/badge wrappers come from the tokens.
  return (
    <div className={surface}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          {header === "side" ? (
            headline
          ) : (
            <div
              className={`${header === "slab" ? t.bannerBlock : t.badgePanel} flex flex-col gap-1`}
            >
              {headline}
            </div>
          )}
        </div>
        <img
          src={picture}
          alt=""
          className={`h-16 w-16 shrink-0 object-cover ${t.photoFrame}`}
        />
      </div>
      {bio}
      {skillsChips}
      <CvDocument sections={cv.sections} design={design} edit={null} />
    </div>
  );
};

export default CvMiniPreview;
