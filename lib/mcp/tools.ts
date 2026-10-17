import type { McpServer } from "@modelcontextprotocol/server";
import { z } from "zod";
import { getProject, getProjectPosture, listProjects } from "@/lib/queries/projects";

function textResult(payload: unknown) {
  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(payload, null, 2),
      },
    ],
  };
}

export function registerMcpTools(server: McpServer) {
  server.registerTool(
    "listProjects",
    {
      title: "List Projects",
      description:
        "List all Zero Trust assessment projects with name, government ITPM, owning division, and environment.",
      inputSchema: z.object({}),
    },
    async () => {
      const projects = await listProjects();
      return textResult(
        projects.map((project) => ({
          id: project.id,
          name: project.name,
          governmentItpm: project.governmentItpm,
          divisionOwner: project.divisionOwner,
          environmentId: project.environmentId,
          environmentName: project.environmentName,
        })),
      );
    },
  );

  server.registerTool(
    "getProjectPosture",
    {
      title: "Get Project Posture",
      description:
        "Get high-level Zero Trust pillar posture for a project: achieved maturity level plus met/inProgress/notStarted/n/a counts and mean completion progress (current vs target %) for basic, intermediate, and advanced tiers across all seven pillars.",
      inputSchema: z.object({
        projectId: z.number().int().positive().describe("Project ID from listProjects"),
      }),
    },
    async ({ projectId }) => {
      const [project, posture] = await Promise.all([
        getProject(projectId),
        getProjectPosture(projectId),
      ]);

      if (!project || !posture) {
        return textResult({ error: `Project ${projectId} not found` });
      }

      return textResult({
        projectId: project.id,
        projectName: project.name,
        pillars: posture.pillars.map((pillar) => ({
          id: pillar.id,
          code: pillar.code,
          name: pillar.name,
          level: pillar.level,
          byLevel: {
            basic: {
              met: pillar.byLevel.basic.met,
              inProgress: pillar.byLevel.basic.inProgress,
              notStarted: pillar.byLevel.basic.notStarted,
              notApplicable: pillar.byLevel.basic.notApplicable,
              progress: pillar.byLevel.basic.progress,
            },
            intermediate: {
              met: pillar.byLevel.intermediate.met,
              inProgress: pillar.byLevel.intermediate.inProgress,
              notStarted: pillar.byLevel.intermediate.notStarted,
              notApplicable: pillar.byLevel.intermediate.notApplicable,
              progress: pillar.byLevel.intermediate.progress,
            },
            advanced: {
              met: pillar.byLevel.advanced.met,
              inProgress: pillar.byLevel.advanced.inProgress,
              notStarted: pillar.byLevel.advanced.notStarted,
              notApplicable: pillar.byLevel.advanced.notApplicable,
              progress: pillar.byLevel.advanced.progress,
            },
          },
        })),
      });
    },
  );
}
