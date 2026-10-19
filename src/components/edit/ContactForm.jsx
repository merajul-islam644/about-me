import { useState } from "react";
import { Plus } from "lucide-react";
import { TextAreaField, TextField } from "./fields";

const LINK_FIELDS = [
  { key: "mail", label: "Email" },
  { key: "github", label: "GitHub" },
  { key: "linkedin", label: "LinkedIn" },
];

const newExtra = () => ({
  id:
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `c-${Math.random().toString(16).slice(2)}`,
  label: "",
  href: "",
});

export const ContactForm = ({ value, onChange }) => {
  const setLink = (key, next) => onChange({ ...value, [key]: next });
  const [draft, setDraft] = useState(newExtra);
  const extras = value.extras ?? [];

  const addContact = () => {
    onChange({ ...value, extras: [...extras, draft] });
    setDraft(newExtra());
  };

  return (
    <div className="flex flex-col gap-5">
      <TextAreaField
        label="Intro"
        value={value.intro}
        onChange={(intro) => onChange({ ...value, intro })}
      />
      {LINK_FIELDS.map(({ key, label }) => (
        <div
          key={key}
          className="rounded-xl border border-white/10 bg-gray-900/50 p-4 grid grid-cols-1 sm:grid-cols-2 gap-3"
        >
          <TextField
            label={`${label} link`}
            value={value[key].href}
            onChange={(href) => setLink(key, { ...value[key], href })}
            placeholder="mailto:you@example.com"
          />
          <TextField
            label={`${label} label`}
            value={value[key].label}
            onChange={(label_) => setLink(key, { ...value[key], label: label_ })}
          />
        </div>
      ))}

      {/* Extra contact links: one section, Add Contact appends and clears. */}
      <div className="rounded-xl border border-white/10 bg-gray-900/50 p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <TextField
          label="New contact label"
          value={draft.label}
          placeholder="WhatsApp"
          onChange={(label) => setDraft({ ...draft, label })}
        />
        <TextField
          label="New contact link"
          value={draft.href}
          placeholder="https://wa.me/8801XXXXXXXXX"
          onChange={(href) => setDraft({ ...draft, href })}
        />
      </div>
      <button
        type="button"
        onClick={addContact}
        disabled={!draft.label.trim() || !draft.href.trim()}
        className="self-start inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium bg-sky-500/10 border border-sky-400/30 text-sky-400 hover:bg-sky-500/20 hover:text-sky-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        <Plus className="w-4 h-4" /> Add Contact
      </button>

      <p className="text-xs text-gray-500">
        The contact form delivers messages to your email link address — use a
        real inbox you check. Icons and button styles come from the design —
        only links and labels are yours to set.
      </p>
    </div>
  );
};
