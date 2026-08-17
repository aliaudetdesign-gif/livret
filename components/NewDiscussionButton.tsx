"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search } from "lucide-react";
import { getProjectColor } from "@/lib/projectColor";
import type { Project } from "@/lib/types";

export function NewDiscussionButton({ projects }: { projects: Project[] }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const term = query.trim().toLowerCase();
  const filteredProjects = term
    ? projects.filter((p) => p.name.toLowerCase().includes(term))
    : projects;

  function toggleOpen() {
    if (!open) setQuery("");
    setOpen((v) => !v);
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={toggleOpen}
        className="flex items-center gap-1.5 btn-clay px-4 py-2.5 text-sm font-semibold whitespace-nowrap"
      >
        <Plus className="w-4 h-4" />
        Nouvelle discussion
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-64 z-10">
          <div className="animate-pop-in glass rounded-card py-2">
            <div className="px-2 pb-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ink-400" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Rechercher un client..."
                  className="w-full pl-8 pr-2.5 py-1.5 text-xs bg-white/70 border border-white/60 rounded-field focus:outline-none focus:border-clay-500 focus:bg-white/90 transition-colors"
                />
              </div>
            </div>

            <div className="max-h-64 overflow-y-auto">
              {filteredProjects.length === 0 ? (
                <p className="px-3 py-2 text-xs text-ink-400">
                  {projects.length === 0
                    ? "Aucun client pour l'instant."
                    : "Aucun client ne correspond."}
                </p>
              ) : (
                filteredProjects.map((project) => {
                  const avatarColor = getProjectColor(project.id);
                  return (
                    <button
                      key={project.id}
                      type="button"
                      onClick={() => {
                        setOpen(false);
                        router.push(`/agence/messagerie/${project.id}`);
                      }}
                      className="flex items-center gap-2.5 w-full px-3 py-2 text-left hover:bg-white/60 transition-colors"
                    >
                      <div
                        className="w-7 h-7 rounded-full text-[10px] flex items-center justify-center font-semibold shrink-0"
                        style={{ backgroundColor: avatarColor.background, color: avatarColor.text }}
                      >
                        {project.name.slice(0, 2).toUpperCase()}
                      </div>
                      <span className="text-sm truncate">{project.name}</span>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
