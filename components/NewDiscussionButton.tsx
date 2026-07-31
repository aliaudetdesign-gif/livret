"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { getProjectColor } from "@/lib/projectColor";
import type { Project } from "@/lib/types";

export function NewDiscussionButton({ projects }: { projects: Project[] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 bg-gradient-terracotta text-white rounded-md px-4 py-2 text-sm font-medium hover-lift whitespace-nowrap"
      >
        <Plus className="w-4 h-4" />
        Nouvelle discussion
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-64 bg-white border border-zinc-100 rounded-lg shadow-lg py-2 z-10 max-h-80 overflow-y-auto">
          {projects.length === 0 ? (
            <p className="px-3 py-2 text-xs text-zinc-400">Aucun client pour l&apos;instant.</p>
          ) : (
            projects.map((project) => {
              const avatarColor = getProjectColor(project.id);
              return (
                <button
                  key={project.id}
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    router.push(`/agence/messagerie/${project.id}`);
                  }}
                  className="flex items-center gap-2.5 w-full px-3 py-2 text-left hover:bg-zinc-50 transition-colors"
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
      )}
    </div>
  );
}
