import Link from "next/link";
import { formatWeekdayDate } from "@/lib/format";

export function DeadlinesTimeline({
  deadlines,
}: {
  deadlines: { id: string; name: string; end_date: string }[];
}) {
  return (
    <div className="glass rounded-card p-[19px] h-full">
      <h2 className="text-[12.5px] font-semibold mb-4">Échéances à venir</h2>
      {deadlines.length === 0 ? (
        <p className="text-xs text-ink-400">Aucune échéance à venir.</p>
      ) : (
        <ul className="relative flex flex-col gap-4 pl-4 before:absolute before:left-[3px] before:top-1.5 before:bottom-1.5 before:w-px before:bg-line">
          {deadlines.map((project) => (
            <li key={project.id} className="relative">
              <span className="absolute -left-4 top-1 w-[7px] h-[7px] rounded-full bg-gradient-terracotta" />
              <Link
                href={`/agence/projets/${project.id}`}
                className="block hover:opacity-80"
              >
                <div className="text-xs font-semibold">{project.name}</div>
                <div className="text-[11px] text-ink-400">
                  {formatWeekdayDate(project.end_date)}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
