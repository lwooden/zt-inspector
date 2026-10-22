import type { McpServer } from "@modelcontextprotocol/server";
import { z } from "zod";
import { getEnvironment, getEnvironmentPosture, listEnvironments } from "@/lib/queries/environments";
import { getProject, getProjectPosture, listProjects } from "@/lib/queries/projects";
import type { PillarPosture } from "@/lib/types/projects";

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

function mapPillars(pillars: PillarPosture[]) {
  return pillars.map((pillar) => ({
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
  }));
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
        pillars: mapPillars(posture.pillars),
      });
    },
  );

  server.registerTool(
    "listEnvironments",
    {
      title: "List Environments",
      description:
        "List all Zero Trust environments with name and description. Projects inherit implementation statements from their environment.",
      inputSchema: z.object({}),
    },
    async () => {
      const environments = await listEnvironments();
      return textResult(
        environments.map((environment) => ({
          id: environment.id,
          name: environment.name,
          description: environment.description,
        })),
      );
    },
  );

  server.registerTool(
    "getEnvironmentPosture",
    {
      title: "Get Environment Posture",
      description:
        "Get high-level Zero Trust pillar posture for an environment: achieved maturity level plus met/inProgress/notStarted/n/a counts and mean completion progress (current vs target %) for basic, intermediate, and advanced tiers across all seven pillars.",
      inputSchema: z.object({
        environmentId: z
          .number()
          .int()
          .positive()
          .describe("Environment ID from listEnvironments"),
      }),
    },
    async ({ environmentId }) => {
      const [environment, posture] = await Promise.all([
        getEnvironment(environmentId),
        getEnvironmentPosture(environmentId),
      ]);

      if (!environment || !posture) {
        return textResult({ error: `Environment ${environmentId} not found` });
      }

      return textResult({
        environmentId: environment.id,
        environmentName: environment.name,
        pillars: mapPillars(posture.pillars),
      });
    },
  );
}
