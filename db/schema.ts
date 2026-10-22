import { relations, sql } from "drizzle-orm";
import {
  bigint,
  check,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const ztLevel = pgEnum("zt_level", ["basic", "intermediate", "advanced"]);

export const implementationStatus = pgEnum("implementation_status", [
  "not_started",
  "in_progress",
  "implemented",
  "not_applicable",
]);

const id = () =>
  bigint("id", { mode: "number" }).primaryKey().generatedByDefaultAsIdentity();

export const pillars = pgTable("pillars", {
  id: id(),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  sortOrder: integer("sort_order").notNull(),
});

export const capabilities = pgTable(
  "capabilities",
  {
    id: id(),
    pillarId: bigint("pillar_id", { mode: "number" })
      .notNull()
      .references(() => pillars.id, { onDelete: "restrict" }),
    code: text("code").notNull(),
    name: text("name").notNull(),
    definition: text("definition").notNull(),
  },
  (table) => [
    uniqueIndex("capabilities_code_unique").on(table.code),
    index("capabilities_pillar_id_idx").on(table.pillarId),
  ],
);

export const measurableOutcomes = pgTable(
  "measurable_outcomes",
  {
    id: id(),
    capabilityId: bigint("capability_id", { mode: "number" })
      .notNull()
      .references(() => capabilities.id, { onDelete: "restrict" }),
    code: text("code").notNull(),
    definition: text("definition").notNull(),
    ztLevel: ztLevel("zt_level").notNull(),
  },
  (table) => [
    uniqueIndex("measurable_outcomes_capability_id_code_unique").on(
      table.capabilityId,
      table.code,
    ),
    index("measurable_outcomes_capability_id_idx").on(table.capabilityId),
  ],
);

export const environments = pgTable("environments", {
  id: id(),
  name: text("name").notNull().unique(),
  description: text("description").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const projects = pgTable(
  "projects",
  {
    id: id(),
    environmentId: bigint("environment_id", { mode: "number" })
      .notNull()
      .references(() => environments.id, { onDelete: "restrict" }),
    name: text("name").notNull(),
    governmentItpm: text("government_itpm").notNull(),
    divisionOwner: text("division_owner").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("projects_environment_id_idx").on(table.environmentId)],
);

export const implementationStatements = pgTable(
  "implementation_statements",
  {
    id: id(),
    projectId: bigint("project_id", { mode: "number" }).references(() => projects.id, {
      onDelete: "cascade",
    }),
    environmentId: bigint("environment_id", { mode: "number" }).references(
      () => environments.id,
      { onDelete: "cascade" },
    ),
    measurableOutcomeId: bigint("measurable_outcome_id", { mode: "number" })
      .notNull()
      .references(() => measurableOutcomes.id, { onDelete: "restrict" }),
    status: implementationStatus("status").notNull(),
    statement: text("statement"),
    currentPercentage: integer("current_percentage").notNull().default(0),
    targetPercentage: integer("target_percentage").notNull().default(100),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("implementation_statements_project_outcome_unique").on(
      table.projectId,
      table.measurableOutcomeId,
    ),
    uniqueIndex("implementation_statements_environment_outcome_unique").on(
      table.environmentId,
      table.measurableOutcomeId,
    ),
    index("implementation_statements_outcome_id_idx").on(table.measurableOutcomeId),
    index("implementation_statements_environment_id_idx").on(table.environmentId),
    check(
      "implementation_statements_one_owner_check",
      sql`num_nonnulls(${table.projectId}, ${table.environmentId}) = 1`,
    ),
  ],
);

export const pillarsRelations = relations(pillars, ({ many }) => ({
  capabilities: many(capabilities),
}));

export const capabilitiesRelations = relations(capabilities, ({ one, many }) => ({
  pillar: one(pillars, {
    fields: [capabilities.pillarId],
    references: [pillars.id],
  }),
  outcomes: many(measurableOutcomes),
}));

export const measurableOutcomesRelations = relations(measurableOutcomes, ({ one, many }) => ({
  capability: one(capabilities, {
    fields: [measurableOutcomes.capabilityId],
    references: [capabilities.id],
  }),
  statements: many(implementationStatements),
}));

export const environmentsRelations = relations(environments, ({ many }) => ({
  projects: many(projects),
  statements: many(implementationStatements),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  environment: one(environments, {
    fields: [projects.environmentId],
    references: [environments.id],
  }),
  statements: many(implementationStatements),
}));

export const implementationStatementsRelations = relations(
  implementationStatements,
  ({ one }) => ({
    project: one(projects, {
      fields: [implementationStatements.projectId],
      references: [projects.id],
    }),
    environment: one(environments, {
      fields: [implementationStatements.environmentId],
      references: [environments.id],
    }),
    outcome: one(measurableOutcomes, {
      fields: [implementationStatements.measurableOutcomeId],
      references: [measurableOutcomes.id],
    }),
  }),
);

export type ZtLevel = (typeof ztLevel.enumValues)[number];
export type ImplementationStatus = (typeof implementationStatus.enumValues)[number];
