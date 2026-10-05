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
        "List all Zero Trust assessment projects with name, government ITPM, and owning division.",
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
        })),
      );
    },
  );

  server.registerTool(
    "getProjectPosture",
    {
      title: "Get Project Posture",
      description:
        "Get high-level Zero Trust pillar posture for a project: achieved maturity level and status counts (implemented, partial, open, n/a) for basic, intermediate, and advanced tiers across all seven pillars.",
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
              implemented: pillar.byLevel.basic.implemented,
              partial: pillar.byLevel.basic.partial,
              open: pillar.byLevel.basic.notStarted,
              notApplicable: pillar.byLevel.basic.notApplicable,
            },
            intermediate: {
              implemented: pillar.byLevel.intermediate.implemented,
              partial: pillar.byLevel.intermediate.partial,
              open: pillar.byLevel.intermediate.notStarted,
              notApplicable: pillar.byLevel.intermediate.notApplicable,
            },
            advanced: {
              implemented: pillar.byLevel.advanced.implemented,
              partial: pillar.byLevel.advanced.partial,
              open: pillar.byLevel.advanced.notStarted,
              notApplicable: pillar.byLevel.advanced.notApplicable,
            },
          },
        })),
      });
    },
  );
}
