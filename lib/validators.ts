import { z } from "zod";
import { implementationStatus, ztLevel } from "@/db/schema";

export const ztLevelSchema = z.enum(ztLevel.enumValues);
export const implementationStatusSchema = z.enum(implementationStatus.enumValues);

export const idSchema = z.coerce.number().int().positive();

export const createCapabilitySchema = z.object({
  pillarId: idSchema,
  code: z.string().trim().min(1),
  name: z.string().trim().min(1),
  definition: z.string().trim().min(1),
});

export const updateCapabilitySchema = z
  .object({
    code: z.string().trim().min(1).optional(),
    name: z.string().trim().min(1).optional(),
    definition: z.string().trim().min(1).optional(),
  })
  .refine(
    (value) =>
      value.code !== undefined || value.name !== undefined || value.definition !== undefined,
    { message: "At least one field is required" },
  );

export const createMeasurableOutcomeSchema = z.object({
  capabilityId: idSchema,
  code: z.string().trim().min(1),
  definition: z.string().trim().min(1),
  ztLevel: ztLevelSchema,
});

export const updateMeasurableOutcomeSchema = z
  .object({
    code: z.string().trim().min(1).optional(),
    definition: z.string().trim().min(1).optional(),
    ztLevel: ztLevelSchema.optional(),
  })
  .refine(
    (value) =>
      value.code !== undefined ||
      value.definition !== undefined ||
      value.ztLevel !== undefined,
    { message: "At least one field is required" },
  );

export const createProjectSchema = z.object({
  name: z.string().trim().min(1),
  governmentItpm: z.string().trim().min(1),
  divisionOwner: z.string().trim().min(1),
});

export const updateProjectSchema = z
  .object({
    name: z.string().trim().min(1).optional(),
    governmentItpm: z.string().trim().min(1).optional(),
    divisionOwner: z.string().trim().min(1).optional(),
  })
  .refine(
    (value) =>
      value.name !== undefined ||
      value.governmentItpm !== undefined ||
      value.divisionOwner !== undefined,
    { message: "At least one field is required" },
  );

export const upsertStatementSchema = z.object({
  status: implementationStatusSchema,
  statement: z.string().nullable(),
});
