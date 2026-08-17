"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUp, ArrowUpRight, ArrowLeftRight } from "lucide-react";
import { ArchitectureA } from "./ArchitectureA";
import { ArchitectureB } from "./ArchitectureB";
import { ArchitectureC } from "./ArchitectureC";
import type { DashboardData } from "./types";

const ARCHITECTURES = [
  { id: "A", label: "Données" },
  { id: "B", label: "Échéances" },
  { id: "C", label: "Clients" },
] as const;

type ArchitectureId = (typeof ARCHITECTURES)[number]["id"];

const STORAGE_KEY = "livret:dashboard-architecture";

export type DashboardStat = {
  label: string;
  value: number;
  trend: number;
  href: string;
};

export function DashboardClient({
  stats,
  data,
}: {
  stats: DashboardStat[];
  data: DashboardData;
}) {
  const [architecture, setArchitecture] = useState<ArchitectureId>("A");

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "A" || stored === "B" || stored === "C") {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- lecture de localStorage, impossible pendant le rendu SSR
      setArchitecture(stored);
    }
  }, []);

  function cycle() {
    const currentIndex = ARCHITECTURES.findIndex((a) => a.id === architecture);
    const next = ARCHITECTURES[(currentIndex + 1) % ARCHITECTURES.length].id;
    setArchitecture(next);
    window.localStorage.setItem(STORAGE_KEY, next);
  }

  const currentLabel =
    ARCHITECTURES.find((a) => a.id === architecture)?.label ?? "Données";

  return (
    <div>
      <div className="flex items-start justify-between mb-[22px] px-1">
        <div>
          <h1 className="text-[27px] font-semibold tracking-[-0.028em]">Dashboard</h1>
          <p className="text-ink-500 text-[13.5px] mt-0.5">
            Gérez, visualisez et personnalisez votre aperçu global
          </p>
        </div>
        <button
          type="button"
          onClick={cycle}
          className="btn-clay flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 shrink-0"
        >
          <ArrowLeftRight className="w-3.5 h-3.5" strokeWidth={2.2} />
          Disposition · {currentLabel}
        </button>
      </div>

      <div className="grid grid-cols-4 gap-3.5 mb-3.5">
        {stats.map((stat) => (
          <StatTrendCard key={stat.label} {...stat} />
        ))}
      </div>

      <div className="mb-[26px]">
        {architecture === "A" && <ArchitectureA data={data} />}
        {architecture === "B" && <ArchitectureB data={data} />}
        {architecture === "C" && <ArchitectureC data={data} />}
      </div>
    </div>
  );
}

function StatTrendCard({ label, value, trend, href }: DashboardStat) {
  return (
    <Link href={href} className="glass hover-lift rounded-card p-[19px] block">
      <div className="flex items-start justify-between mb-[22px]">
        <div className="text-[12.5px] font-medium text-ink-700 max-w-[110px] leading-[1.35]">
          {label}
        </div>
        <div className="w-7 h-7 rounded-full bg-ink-900/90 text-white flex items-center justify-center shrink-0">
          <ArrowUpRight className="w-3.5 h-3.5" strokeWidth={2} />
        </div>
      </div>
      <div className="text-[34px] font-semibold tracking-[-0.04em] leading-none mb-[11px]">
        {value}
      </div>
      {trend > 0 && (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-ok-600 bg-ok-100 rounded-full px-2.5 py-[3.5px]">
          <ArrowUp className="w-[11px] h-[11px]" strokeWidth={2.4} />
          {trend}
        </span>
      )}
    </Link>
  );
}
