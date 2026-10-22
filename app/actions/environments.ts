"use server";

import { apiFetch, ApiError } from "@/lib/api";
import type {
  ImplementationStatementRow,
  UpsertStatementInput,
  UpsertStatementResult,
} from "@/app/actions/projects";
import type {
  Environment,
  EnvironmentPillarDetail,
  EnvironmentPosture,
} from "@/lib/types/environments";

export type CreateEnvironmentInput = {
  name: string;
  description: string;
};

export type UpdateEnvironmentInput = CreateEnvironmentInput;

export type EnvironmentResult =
  | { ok: true; environment: Environment }
  | { ok: false; error: string };

export type DeleteEnvironmentResult = { ok: true } | { ok: false; error: string };

export async function fetchEnvironments(): Promise<Environment[]> {
  const data = await apiFetch<{ environments: Environment[] }>("/api/environments");
  return data.environments;
}

export async function fetchEnvironment(id: number | string): Promise<Environment | null> {
  try {
    return await apiFetch<Environment>(`/api/environments/${id}`);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

export async function fetchEnvironmentPosture(
  id: number | string,
): Promise<EnvironmentPosture | null> {
  try {
    return await apiFetch<EnvironmentPosture>(`/api/environments/${id}/posture`);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

export async function fetchEnvironmentPillarDetail(
  environmentId: number | string,
  pillarId: number | string,
): Promise<EnvironmentPillarDetail | null> {
  try {
    return await apiFetch<EnvironmentPillarDetail>(
      `/api/environments/${environmentId}/pillars/${pillarId}`,
    );
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

export async function createEnvironment(
  input: CreateEnvironmentInput,
): Promise<EnvironmentResult> {
  try {
    const environment = await apiFetch<Environment>("/api/environments", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(input),
    });
    return { ok: true, environment };
  } catch (error) {
    if (error instanceof ApiError) return { ok: false, error: error.message };
    return { ok: false, error: "Failed to create environment" };
  }
}

export async function updateEnvironment(
  id: number | string,
  input: UpdateEnvironmentInput,
): Promise<EnvironmentResult> {
  try {
    const environment = await apiFetch<Environment>(`/api/environments/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(input),
    });
    return { ok: true, environment };
  } catch (error) {
    if (error instanceof ApiError) return { ok: false, error: error.message };
    return { ok: false, error: "Failed to update environment" };
  }
}

export async function deleteEnvironment(
  id: number | string,
): Promise<DeleteEnvironmentResult> {
  try {
    await apiFetch<null>(`/api/environments/${id}`, { method: "DELETE" });
    return { ok: true };
  } catch (error) {
    if (error instanceof ApiError) return { ok: false, error: error.message };
    return { ok: false, error: "Failed to delete environment" };
  }
}

export async function upsertEnvironmentStatement(
  environmentId: number | string,
  measurableOutcomeId: number | string,
  input: UpsertStatementInput,
): Promise<UpsertStatementResult> {
  try {
    const statement = await apiFetch<ImplementationStatementRow>(
      `/api/environments/${environmentId}/statements/${measurableOutcomeId}`,
      {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(input),
      },
    );
    return { ok: true, statement };
  } catch (error) {
    if (error instanceof ApiError) return { ok: false, error: error.message };
    return { ok: false, error: "Failed to update statement" };
  }
}
