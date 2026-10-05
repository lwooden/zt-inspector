import { OutcomeStatementCard } from "@/components/outcome-statement-card";
import type { PillarOutcomeAssessment } from "@/lib/types/projects";
import { ZT_LEVELS } from "@/lib/posture";

type PillarLevelSectionsProps = {
  projectId: number;
  outcomes: PillarOutcomeAssessment[];
};

function formatLevelLabel(level: string) {
  return level.charAt(0).toUpperCase() + level.slice(1);
}

export function PillarLevelSections({ projectId, outcomes }: PillarLevelSectionsProps) {
  return (
    <div className="flex flex-col gap-8">
      {ZT_LEVELS.map((level) => {
        const levelOutcomes = outcomes.filter((outcome) => outcome.ztLevel === level);

        return (
          <section key={level} className="flex flex-col gap-3">
            <h2 className="text-lg font-semibold tracking-tight text-foreground">
              {formatLevelLabel(level)}
            </h2>

            {levelOutcomes.length === 0 ? (
              <p className="border border-border bg-surface px-4 py-3 text-sm text-muted">
                No measurable outcomes at this level
              </p>
            ) : (
              <ul className="flex flex-col gap-3">
                {levelOutcomes.map((outcome) => (
                  <OutcomeStatementCard
                    key={outcome.id}
                    projectId={projectId}
                    outcome={outcome}
                  />
                ))}
              </ul>
            )}
          </section>
        );
      })}
    </div>
  );
}
