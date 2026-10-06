import Link from "next/link";
import type { PillarPosture } from "@/lib/types/projects";
import { ZT_LEVELS } from "@/lib/posture";

type PillarPostureListProps = {
  projectId: number | string;
  pillars: PillarPosture[];
};

function formatLevel(level: string) {
  return level.replaceAll("_", " ");
}

export function PillarPostureList({ projectId, pillars }: PillarPostureListProps) {
  return (
    <div className="overflow-x-auto border border-border bg-surface">
      <table className="w-full min-w-[40rem] border-collapse text-left text-sm">
        <thead className="border-b border-border bg-background/80 text-xs uppercase tracking-wide text-muted">
          <tr>
            <th className="px-4 py-3 font-medium">Pillar</th>
            <th className="px-4 py-3 font-medium">Level</th>
            <th className="px-4 py-3 font-medium">Basic</th>
            <th className="px-4 py-3 font-medium">Intermediate</th>
            <th className="px-4 py-3 font-medium">Advanced</th>
          </tr>
        </thead>
        <tbody>
          {pillars.map((pillar) => (
            <tr
              key={pillar.id}
              className="border-b border-border last:border-b-0 align-top"
            >
              <td className="px-4 py-3">
                <Link
                  href={`/projects/${projectId}/pillars/${pillar.id}`}
                  className="font-medium text-accent underline-offset-2 hover:underline"
                >
                  {pillar.name}
                </Link>
              </td>
              <td className="px-4 py-3">
                <span className="inline-block border border-border bg-background px-2 py-0.5 font-mono text-xs lowercase text-foreground">
                  {formatLevel(pillar.level)}
                </span>
              </td>
              {ZT_LEVELS.map((level) => {
                const counts = pillar.byLevel[level];
                return (
                  <td
                    key={level}
                    className="px-4 py-3 font-mono text-xs text-muted"
                  >
                    <div>progress {Math.round(counts.progress)}%</div>
                    <div>met {counts.met}</div>
                    <div>in progress {counts.inProgress}</div>
                    <div>not started {counts.notStarted}</div>
                    <div>n/a {counts.notApplicable}</div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
