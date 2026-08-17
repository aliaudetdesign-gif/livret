"use client";

import { startTransition, useActionState, useEffect, useRef, useState } from "react";
import { updateProjectBrief, type BriefActionState } from "@/app/agence/projets/[id]/actions";
import { briefSections } from "@/lib/briefFields";

const initialState: BriefActionState = { error: null };

const inputClass =
  "w-full px-3 py-2 text-sm bg-white/70 border border-white/60 rounded-field focus:outline-none focus:border-clay-500 focus:bg-white/90 transition-colors";
const textareaClass = `${inputClass} resize-y min-h-[72px]`;
const labelClass = "block text-xs font-medium text-ink-500 mb-1.5";

type SaveStatus = "idle" | "dirty" | "saving" | "saved";

export function ProjectBriefForm({
  projectId,
  brief,
}: {
  projectId: string;
  brief: Record<string, string>;
}) {
  const [state, formAction, pending] = useActionState(updateProjectBrief, initialState);
  const wasPending = useRef(false);
  const [status, setStatus] = useState<SaveStatus>("idle");
  const formRef = useRef<HTMLFormElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (wasPending.current && !pending) {
      setStatus(state.error ? "idle" : "saved");
    }
    wasPending.current = pending;
  }, [pending, state]);

  useEffect(() => {
    if (status !== "saved") return;
    const timeout = setTimeout(() => setStatus("idle"), 2500);
    return () => clearTimeout(timeout);
  }, [status]);

  function saveNow() {
    if (!formRef.current) return;
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setStatus("saving");
    const data = new FormData(formRef.current);
    startTransition(() => {
      formAction(data);
    });
  }

  // Enregistrement automatique 1,2s après la dernière frappe, pour éviter de
  // perdre les réponses si l'utilisateur quitte la page sans cliquer "Enregistrer".
  function scheduleSave() {
    setStatus("dirty");
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      timeoutRef.current = null;
      saveNow();
    }, 1200);
  }

  // Avertit avant de fermer l'onglet si une saisie n'a pas encore été enregistrée.
  useEffect(() => {
    function handleBeforeUnload(e: BeforeUnloadEvent) {
      if (timeoutRef.current || status === "saving") {
        e.preventDefault();
        e.returnValue = "";
      }
    }
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [status]);

  return (
    <form ref={formRef} action={formAction} onChange={scheduleSave} className="flex flex-col gap-4">
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

      <div className="flex items-center gap-3 text-sm min-h-[2rem]">
        {status === "dirty" && (
          <>
            <span className="text-ink-500">Modifications en attente...</span>
            <button
              type="button"
              onClick={saveNow}
              className="text-clay-600 font-medium hover:underline"
            >
              Enregistrer maintenant
            </button>
          </>
        )}
        {status === "saving" && <span className="text-ink-500">Enregistrement...</span>}
        {status === "saved" && <span className="text-ok-600">Brief enregistré.</span>}
        {status === "idle" && (
          <span className="text-ink-400">Les modifications sont enregistrées automatiquement.</span>
        )}
      </div>
    </form>
  );
}
