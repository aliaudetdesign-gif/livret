"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export interface NavItem {
  label: string;
  href: string;
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
    <aside className="w-64 shrink-0 bg-[var(--color-noir-doux)] text-white flex flex-col justify-between sticky top-0 h-screen overflow-y-auto">
      <div>
        <div className="px-6 py-6">
          <span className="text-xl font-semibold">
            livret<span className="text-gradient-terracotta">.</span>
          </span>
        </div>

        {groups.map((group) => (
          <div key={group.label} className="mb-4">
            {group.label && (
              <div className="px-6 pb-2 text-xs uppercase tracking-wide text-white/40">
                {group.label}
              </div>
            )}
            <nav className="px-3 flex flex-col gap-1">
              {group.items.map((item) => {
                const active = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`px-3 py-2 rounded-md text-sm transition-colors ${
                      active
                        ? "bg-white text-[var(--color-noir-doux)] font-medium"
                        : "text-white/80 hover:bg-white/10"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        ))}
      </div>

      {(() => {
        const content = (
          <>
            <div className="w-8 h-8 rounded-md bg-gradient-terracotta flex items-center justify-center text-sm font-semibold overflow-hidden shrink-0">
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                accountLabel.slice(0, 2).toUpperCase()
              )}
            </div>
            <div className="text-sm min-w-0">
              <div className="font-medium truncate">{accountLabel}</div>
              <div className="text-white/50 text-xs">{accountSubLabel}</div>
            </div>
          </>
        );

        return accountHref ? (
          <Link
            href={accountHref}
            className="px-6 py-5 border-t border-white/10 flex items-center gap-3 hover:bg-white/5 transition-colors"
          >
            {content}
          </Link>
        ) : (
          <div className="px-6 py-5 border-t border-white/10 flex items-center gap-3">{content}</div>
        );
      })()}
    </aside>
  );
}
