import { useState } from "react";
import { Plus, Sparkles } from "lucide-react";
import { TextField } from "./fields";

const newProject = () => ({
  id:
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `p-${Math.random().toString(16).slice(2)}`,
  title: "",
  desc: "",
  github: "#",
  live: "#",
});

// One section: type a new project's details, Add Project appends it to the
// list (existing projects are kept untouched) and the section clears.
// `limit` (number | null) is the free plan's project ceiling — null means Pro.
export const ProjectsForm = ({ value, onChange, limit }) => {
  const [draft, setDraft] = useState(newProject);
  const atLimit = typeof limit === "number" && value.length >= limit;

  const addProject = () => {
    onChange([...value, draft]);
    setDraft(newProject());
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-xl border border-white/10 bg-gray-900/50 p-4 flex flex-col gap-3">
        <TextField
          label="Title"
          value={draft.title}
          placeholder="My new project"
          onChange={(title) => setDraft({ ...draft, title })}
        />
        <TextField
          label="Description"
          value={draft.desc}
          placeholder="What it does, in one line"
          onChange={(desc) => setDraft({ ...draft, desc })}
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <TextField
            label="GitHub URL"
            value={draft.github}
            onChange={(github) => setDraft({ ...draft, github })}
          />
          <TextField
            label="Live demo URL"
            value={draft.live}
            onChange={(live) => setDraft({ ...draft, live })}
          />
        </div>
      </div>
      {atLimit ? (
        <p className="self-start inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium text-amber-400 border border-amber-400/30 bg-amber-400/10">
          <Sparkles className="w-4 h-4" />
          Free plan holds {limit} projects — upgrade on the Upgrade tab for unlimited.
        </p>
      ) : (
        <button
          type="button"
          onClick={addProject}
          disabled={!draft.title.trim()}
          className="self-start inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium bg-sky-500/10 border border-sky-400/30 text-sky-400 hover:bg-sky-500/20 hover:text-sky-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Project
        </button>
      )}
    </div>
  );
};
