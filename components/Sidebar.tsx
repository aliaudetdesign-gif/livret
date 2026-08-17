"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CircleHelp,
  FileText,
  FolderOpen,
  LayoutDashboard,
  MessageCircle,
  Palette,
  Settings,
  Trash2,
  type LucideIcon,
} from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
  dashboard: LayoutDashboard,
  projets: FolderOpen,
  messagerie: MessageCircle,
  corbeille: Trash2,
  reglages: Settings,
  aide: CircleHelp,
  administratif: FileText,
  design: Palette,
};

export type NavIcon = keyof typeof ICONS;

export interface NavItem {
  label: string;
  href: string;
  icon?: NavIcon;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

export function Sidebar({
  sectionLabel,
  navItems,
  navGroups,
  accountLabel,
  accountSubLabel,
  accountHref,
  avatarUrl,
}: {
  sectionLabel?: string;
  navItems?: NavItem[];
  navGroups?: NavGroup[];
  accountLabel: string;
  accountSubLabel: string;
  accountHref?: string;
  avatarUrl?: string | null;
}) {
  const pathname = usePathname();

  const groups: NavGroup[] = navGroups ?? [
    { label: sectionLabel ?? "", items: navItems ?? [] },
  ];

  return (
    <>
      {/* Espaceur : occupe la largeur de la sidebar dans le flux flex
          (celle-ci passe en position fixed juste après, donc sans cet
          espaceur le contenu principal, en flex-1, recouvrirait sa place). */}
      <div className="w-[246px] shrink-0" aria-hidden />
      {/* Le fixed est porté par ce wrapper neutre, pas directement par
          l'aside : `.glass` force `position: relative` (nécessaire pour son
          ::after et le z-index de son contenu), ce qui écraserait sinon le
          `fixed` de Tailwind (règle non "layered" de globals.css vs. utilitaire
          Tailwind — le fixed perdait silencieusement, la sidebar restait dans
          le flux et défilait avec la page). */}
      <div className="fixed w-[246px] top-7 left-[22px] bottom-7">
      <aside className="glass w-full h-full rounded-panel px-3.5 pt-6 pb-3.5 flex flex-col overflow-y-auto">
      <div className="px-2.5 pb-6 text-[21px] font-semibold tracking-[-0.02em]">
        livret<span className="text-gradient-terracotta">.</span>
      </div>

      {groups.map((group) => (
        <div key={group.label} className="mb-[18px]">
          {group.label && (
            <div className="px-2.5 pb-2.5 text-[10px] font-medium uppercase tracking-[0.13em] text-ink-400">
              {group.label}
            </div>
          )}
          <nav className="flex flex-col gap-0.5">
            {group.items.map((item) => {
              const active = pathname === item.href;
              const Icon = item.icon ? ICONS[item.icon] : null;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`flex items-center gap-2.5 px-[11px] py-[9px] rounded-[12px] text-[13.5px] transition-all duration-150 ${
                    active
                      ? "bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(255,255,255,0.72))] text-ink-900 font-semibold shadow-[0_2px_8px_-3px_rgba(52,36,26,0.2),inset_0_1px_0_#fff]"
                      : "text-ink-700 hover:bg-white/55 hover:text-ink-900"
                  }`}
                >
                  {Icon && (
                    <Icon
                      size={15}
                      strokeWidth={1.7}
                      aria-hidden
                      className={
                        active ? "text-clay-500 shrink-0" : "opacity-60 shrink-0"
                      }
                    />
                  )}
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      ))}

      {(() => {
        const content = (
          <>
            <div className="w-8 h-8 rounded-[11px] bg-gradient-terracotta flex items-center justify-center text-[11.5px] font-semibold text-white overflow-hidden shrink-0">
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                accountLabel.slice(0, 2).toUpperCase()
              )}
            </div>
            <div className="min-w-0">
              <div className="text-[12.5px] font-semibold truncate text-ink-900">
                {accountLabel}
              </div>
              <div className="text-[11px] text-ink-500">{accountSubLabel}</div>
            </div>
          </>
        );

        const shell =
          "mt-auto flex items-center gap-2.5 p-[11px] rounded-[16px] bg-white/40 border border-white/50 transition-colors";

        return accountHref ? (
          <Link href={accountHref} className={`${shell} hover:bg-white/65`}>
            {content}
          </Link>
        ) : (
          <div className={shell}>{content}</div>
        );
      })()}
      </aside>
      </div>
    </>
  );
}
