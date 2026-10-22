"use server";

import { apiFetch, ApiError } from "@/lib/api";
import type { ImplementationStatus } from "@/db/schema";
import type { Project, ProjectPillarDetail, ProjectPosture } from "@/lib/types/projects";

export type CreateProjectInput = {
  name: string;
  governmentItpm: string;
  divisionOwner: string;
  environmentId: number;
};

export type UpdateProjectInput = CreateProjectInput;

export type UpsertStatementInput = {
  status: ImplementationStatus;
  statement: string | null;
  currentPercentage: number;
  targetPercentage: number;
};

export type ImplementationStatementRow = {
  id: number;
  projectId: number | null;
  environmentId: number | null;
  measurableOutcomeId: number;
  status: ImplementationStatus;
  statement: string | null;
  currentPercentage: number;
  targetPercentage: number;
  createdAt: Date | string;
  updatedAt: Date | string;
};

export type CreateProjectResult =
  | { ok: true; project: Project }
  | { ok: false; error: string };

export type UpdateProjectResult = CreateProjectResult;

export type DeleteProjectResult = { ok: true } | { ok: false; error: string };

export type UpsertStatementResult =
  | { ok: true; statement: ImplementationStatementRow }
  | { ok: false; error: string };

export async function fetchProjects(): Promise<Project[]> {
  const data = await apiFetch<{ projects: Project[] }>("/api/projects");
  return data.projects;
}

export async function fetchProject(id: number | string): Promise<Project | null> {
  try {
    return await apiFetch<Project>(`/api/projects/${id}`);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

export async function fetchProjectPosture(
  id: number | string,
): Promise<ProjectPosture | null> {
  try {
    return await apiFetch<ProjectPosture>(`/api/projects/${id}/posture`);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

export async function fetchProjectPillarDetail(
  projectId: number | string,
  pillarId: number | string,
): Promise<ProjectPillarDetail | null> {
  try {
    return await apiFetch<ProjectPillarDetail>(
      `/api/projects/${projectId}/pillars/${pillarId}`,
    );
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

export async function createProject(
  input: CreateProjectInput,
): Promise<CreateProjectResult> {
  try {
    const project = await apiFetch<Project>("/api/projects", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(input),
    });
    return { ok: true, project };
  } catch (error) {
    if (error instanceof ApiError) {
      return { ok: false, error: error.message };
    }
    return { ok: false, error: "Failed to create project" };
  }
}

export async function updateProject(
  id: number | string,
  input: UpdateProjectInput,
): Promise<UpdateProjectResult> {
  try {
    const project = await apiFetch<Project>(`/api/projects/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(input),
    });
    return { ok: true, project };
  } catch (error) {
    if (error instanceof ApiError) {
      return { ok: false, error: error.message };
    }
    return { ok: false, error: "Failed to update project" };
  }
}

export async function deleteProject(
  id: number | string,
): Promise<DeleteProjectResult> {
  try {
    await apiFetch<null>(`/api/projects/${id}`, { method: "DELETE" });
    return { ok: true };
  } catch (error) {
    if (error instanceof ApiError) {
      return { ok: false, error: error.message };
    }
    return { ok: false, error: "Failed to delete project" };
  }
}

export async function upsertStatement(
  projectId: number | string,
  measurableOutcomeId: number | string,
  input: UpsertStatementInput,
): Promise<UpsertStatementResult> {
  try {
    const statement = await apiFetch<ImplementationStatementRow>(
      `/api/projects/${projectId}/statements/${measurableOutcomeId}`,
      {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(input),
      },
    );
    return { ok: true, statement };
  } catch (error) {
    if (error instanceof ApiError) {
      return { ok: false, error: error.message };
    }
    return { ok: false, error: "Failed to update statement" };
  }
}

export async function revertStatement(
  projectId: number | string,
  measurableOutcomeId: number | string,
): Promise<DeleteProjectResult> {
  try {
    await apiFetch<null>(
      `/api/projects/${projectId}/statements/${measurableOutcomeId}`,
      { method: "DELETE" },
    );
    return { ok: true };
  } catch (error) {
    if (error instanceof ApiError) {
      return { ok: false, error: error.message };
    }
    return { ok: false, error: "Failed to revert statement" };
  }
}
