import { Plus, X } from "lucide-react";
import { ACCENT_CLASS_OPTIONS } from "../../content/portfolioShape";
import { SelectField, TextAreaField } from "./fields";

const ACCENT_OPTIONS = ACCENT_CLASS_OPTIONS.map((value, index) => ({
  value,
  label: `Accent style ${index + 1}`,
}));

export const AboutForm = ({ value, onChange }) => {
  const setParagraph = (index, next) =>
    onChange({
      paragraphs: value.paragraphs.map((p, i) => (i === index ? next : p)),
    });

  return (
    <div className="flex flex-col gap-5">
      {value.paragraphs.map((paragraph, index) => (
        <div
          key={index}
          className="rounded-xl border border-white/10 bg-gray-900/50 p-4 flex flex-col gap-3"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Paragraph {index + 1}
            </span>
            <button
              type="button"
              title="Remove paragraph"
              onClick={() =>
                onChange({
                  paragraphs: value.paragraphs.filter((_, i) => i !== index),
                })
              }
              className="p-1.5 rounded-md text-gray-400 hover:text-red-400 hover:bg-white/5 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <TextAreaField
            label="Text"
            value={paragraph.text}
            onChange={(text) =>
              setParagraph(index, { ...paragraph, text })
            }
            hint="Wrap words in **double asterisks** to highlight them."
          />
          <SelectField
            label="Highlight style"
            value={paragraph.accentClass}
            onChange={(accentClass) =>
              setParagraph(index, { ...paragraph, accentClass })
            }
            options={ACCENT_OPTIONS}
          />
        </div>
      ))}
      <button
        type="button"
        onClick={() =>
          onChange({
            paragraphs: [
              ...value.paragraphs,
              {
                text: "",
                accentClass: ACCENT_CLASS_OPTIONS[0],
              },
            ],
          })
        }
        className="self-start inline-flex items-center gap-1.5 text-sm font-medium text-sky-400 hover:text-sky-300"
      >
        <Plus className="w-4 h-4" /> Add paragraph
      </button>
    </div>
  );
};
