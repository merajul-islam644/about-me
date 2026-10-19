import { Plus, X } from "lucide-react";
import { TextField } from "./fields";

export const SkillsForm = ({ value, onChange }) => (
  <div className="flex flex-col gap-5">
    <p className="text-sm text-gray-400">
      Plain badges shown on the Skills page — the order here is the render
      order.
    </p>
    {value.map((skill, index) => (
      <div key={index} className="flex items-end gap-2">
        <div className="flex-1">
          <TextField
            label={`Skill ${index + 1}`}
            value={skill}
            onChange={(next) =>
              onChange(value.map((s, i) => (i === index ? next : s)))
            }
          />
        </div>
        <button
          type="button"
          title="Remove skill"
          onClick={() => onChange(value.filter((_, i) => i !== index))}
          className="mb-1 p-2 rounded-md text-gray-400 hover:text-red-400 hover:bg-white/5 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    ))}
    <button
      type="button"
      onClick={() => onChange([...value, ""])}
      className="self-start inline-flex items-center gap-1.5 text-sm font-medium text-sky-400 hover:text-sky-300"
    >
      <Plus className="w-4 h-4" /> Add skill
    </button>
  </div>
);
