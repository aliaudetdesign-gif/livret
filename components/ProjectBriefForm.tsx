"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { updateProjectBrief, type BriefActionState } from "@/app/agence/projets/[id]/actions";
import { briefSections } from "@/lib/briefFields";

const initialState: BriefActionState = { error: null };

const inputClass =
  "w-full px-3 py-2 text-sm bg-white/70 border border-white/60 rounded-field focus:outline-none focus:border-clay-500 focus:bg-white/90 transition-colors";
const textareaClass = `${inputClass} resize-y min-h-[72px]`;
const labelClass = "block text-xs font-medium text-ink-500 mb-1.5";

export function ProjectBriefForm({
  projectId,
  brief,
}: {
  projectId: string;
  brief: Record<string, string>;
}) {
  const [state, formAction, pending] = useActionState(updateProjectBrief, initialState);
  const wasPending = useRef(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (wasPending.current && !pending && !state.error) {
      setSaved(true);
      const timeout = setTimeout(() => setSaved(false), 3000);
      return () => clearTimeout(timeout);
    }
    wasPending.current = pending;
  }, [pending, state]);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="project_id" value={projectId} />

      {briefSections.map((section) => (
        <div key={section.title} className="glass rounded-card p-5">
          <p className="text-sm font-medium mb-4">
            <span className="mr-1.5">{section.icon}</span>
            {section.title}
          </p>
          <div className="grid grid-cols-2 gap-4">
            {section.fields.map((field) => (
              <div
                key={field.key}
                className={section.fields.length === 1 ? "col-span-2" : undefined}
              >
                <label htmlFor={field.key} className={labelClass}>
                  {field.label}
                </label>
                {field.type === "textarea" ? (
                  <textarea
                    id={field.key}
                    name={field.key}
                    defaultValue={brief[field.key] ?? ""}
                    className={textareaClass}
                  />
                ) : (
                  <input
                    id={field.key}
                    name={field.key}
                    defaultValue={brief[field.key] ?? ""}
                    className={inputClass}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      {state.error && (
        <p className="text-sm text-err-600 bg-err-100 border border-err-600/15 rounded-field px-3.5 py-2.5">{state.error}</p>
      )}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="self-start btn-clay text-sm font-semibold px-5 py-2.5 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {pending ? "Enregistrement..." : "Enregistrer le brief"}
        </button>
        {saved && <span className="text-sm text-ok-600">Brief enregistré.</span>}
      </div>
    </form>
  );
}
