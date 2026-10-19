import { ArrowDown, ArrowUp, Plus, X } from "lucide-react";
import {
  ACCENT_CLASS_OPTIONS,
  SKILL_COLOR_OPTIONS,
} from "../../content/portfolioShape";
import { SelectField, TextAreaField, TextField } from "./fields";

const ACCENT_OPTIONS = ACCENT_CLASS_OPTIONS.map((value, index) => ({
  value,
  label: `Accent style ${index + 1}`,
}));

const smallButton =
  "p-1.5 rounded-md text-gray-400 hover:text-sky-300 hover:bg-white/5 transition-colors disabled:opacity-30 disabled:cursor-not-allowed";

export const HeroForm = ({ value, onChange }) => {
  const patch = (next) => onChange({ ...value, ...next });

  const setSkill = (index, next) =>
    patch({
      skills: value.skills.map((skill, i) => (i === index ? next : skill)),
    });

  const moveSkill = (index, delta) => {
    const target = index + delta;
    if (target < 0 || target >= value.skills.length) return;
    const skills = [...value.skills];
    [skills[index], skills[target]] = [skills[target], skills[index]];
    patch({ skills });
  };

  return (
    <div className="flex flex-col gap-5">
      <TextField
        label="Greeting"
        value={value.greeting}
        onChange={(greeting) => patch({ greeting })}
        placeholder="Hi, I'm …"
      />
      <TextField
        label="Title"
        value={value.title}
        onChange={(title) => patch({ title })}
        placeholder="Frontend Developer | React Enthusiast"
      />
      <TextAreaField
        label="Intro"
        value={value.bio.text}
        onChange={(text) => patch({ bio: { ...value.bio, text } })}
        hint="Wrap words in **double asterisks** to highlight them."
      />
      <SelectField
        label="Highlight style"
        value={value.bio.accentClass}
        onChange={(accentClass) => patch({ bio: { ...value.bio, accentClass } })}
        options={ACCENT_OPTIONS}
      />

      <div>
        <span className="text-sm font-medium text-gray-300">Skill badges</span>
        <div className="mt-2 flex flex-col gap-3">
          {value.skills.map((skill, index) => (
            <div
              key={index}
              className="rounded-xl border border-white/10 bg-gray-900/50 p-3 flex flex-col gap-3"
            >
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={skill.name}
                  placeholder="Skill name"
                  onChange={(event) =>
                    setSkill(index, { ...skill, name: event.target.value })
                  }
                  className="flex-1 rounded-lg bg-gray-900/70 border border-white/10 px-3 py-2 text-sm text-gray-200 placeholder-gray-500 focus:border-sky-400 focus:outline-none"
                />
                <button
                  type="button"
                  title="Move up"
                  aria-label={`Move ${skill.name} up`}
                  disabled={index === 0}
                  onClick={() => moveSkill(index, -1)}
                  className={smallButton}
                >
                  <ArrowUp className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  title="Move down"
                  aria-label={`Move ${skill.name} down`}
                  disabled={index === value.skills.length - 1}
                  onClick={() => moveSkill(index, 1)}
                  className={smallButton}
                >
                  <ArrowDown className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  title="Remove"
                  aria-label={`Remove ${skill.name}`}
                  onClick={() =>
                    patch({
                      skills: value.skills.filter((_, i) => i !== index),
                    })
                  }
                  className={`${smallButton} hover:text-red-400`}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="flex items-center gap-2">
                {SKILL_COLOR_OPTIONS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    title={color}
                    aria-label={`Badge color ${color}`}
                    aria-pressed={skill.color === color}
                    onClick={() => setSkill(index, { ...skill, color })}
                    className={`w-7 h-7 rounded-full border-2 transition-transform ${
                      skill.color === color
                        ? "border-sky-300 scale-110"
                        : "border-transparent hover:scale-105"
                    } ${color.split(" ")[0]}`}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() =>
            patch({
              skills: [
                ...value.skills,
                { name: "", color: SKILL_COLOR_OPTIONS[3] },
              ],
            })
          }
          className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-sky-400 hover:text-sky-300"
        >
          <Plus className="w-4 h-4" /> Add skill
        </button>
      </div>
    </div>
  );
};
