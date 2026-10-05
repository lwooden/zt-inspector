import { config } from "dotenv";
import { eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import {
	capabilities,
	measurableOutcomes,
	implementationStatements,
	pillars,
	projects,
} from "./schema";

config({ path: ".env.local" });

const LOREM_IPSUM =
	"Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.";

const PILLARS = [
	{
		code: "user",
		name: "User",
		description:
			"Identity of users and non-person entities, including authentication and access decisions.",
		sortOrder: 1,
	},
	{
		code: "device",
		name: "Device",
		description:
			"Devices that access resources, including their identity, compliance, and authorization.",
		sortOrder: 2,
	},
	{
		code: "application_workload",
		name: "Application & Workload",
		description:
			"Applications and workloads, including how they are secured and how they call each other.",
		sortOrder: 3,
	},
	{
		code: "data",
		name: "Data",
		description:
			"Data assets, including classification, protection, and access.",
		sortOrder: 4,
	},
	{
		code: "network_environment",
		name: "Network & Environment",
		description:
			"Networks and environments, including segmentation, encryption, and access control.",
		sortOrder: 5,
	},
	{
		code: "automation_orchestration",
		name: "Automation & Orchestration",
		description:
			"Automated enforcement and orchestrated response based on security policy.",
		sortOrder: 6,
	},
	{
		code: "visibility_analytics",
		name: "Visibility & Analytics",
		description:
			"Telemetry and analysis used to understand activity across the system.",
		sortOrder: 7,
	},
] as const;

type CapabilitySeed = { code: string; name: string };

const CAPABILITIES_BY_PILLAR: Record<string, readonly CapabilitySeed[]> = {
	user: [
		{ code: "US.1", name: "User Inventory" },
		{ code: "US.2", name: "Identity & Credential Management" },
		{ code: "US.3", name: "Multi-Factor Authentication" },
		{ code: "US.4", name: "Privileged Access Management" },
	],
	device: [
		{ code: "DV.1", name: "Device Inventory" },
		{ code: "DV.2", name: "Device Detection and Compliance" },
		{ code: "DV.3", name: "Device Authorization with Real Time Inspection" },
	],
	application_workload: [
		{ code: "AW.1", name: "Application Inventory" },
		{ code: "AW.2", name: "Secure Software Development & Integration" },
		{ code: "AW.3", name: "Software Risk Management" },
	],
	data: [
		{ code: "DT.1", name: "Data Catalog Risk Assessment" },
		{ code: "DT.2", name: "DoD Enterprise Data Governance" },
		{ code: "DT.3", name: "Data Labeling and Tagging" },
		{ code: "DT.4", name: "Data Monitoring and Sensing" },
	],
	network_environment: [
		{ code: "NE.1", name: "Data Flow Mapping" },
		{ code: "NE.2", name: "Software Defined Networking (SDN)" },
		{ code: "NE.3", name: "Macro Segmentation" },
	],
	automation_orchestration: [
		{
			code: "AO.1",
			name: "Policy Decision Point (PDP) & Policy Orchestration",
		},
		{ code: "AO.2", name: "Critical Process Automation" },
	],
	visibility_analytics: [
		{ code: "VA.1", name: "Log All Traffic (Network, Data, Apps, Users)" },
		{ code: "VA.2", name: "Security Information and Event Management (SIEM)" },
		{ code: "VA.3", name: "Common Security and Risk Analytics" },
		{ code: "VA.4", name: "User and Entity Behavior Analytics" },
	],
};

const SAMPLE_PROJECT = {
	name: "Low Cool App",
	governmentItpm: "Lowell Wooden",
	divisionOwner: "MSD",
} as const;

const MEASURABLE_OUTCOMES_BY_CAPABILITY: Record<string, readonly string[]> = {
	"US.1": ["US.1.B.1"],
	"US.2": [
		"US.2.B.1",
		"US.2.B.2",
		"US.2.B.3",
		"US.2.B.4",
		"US.2.B.5",
		"US.2.B.6",
		"US.2.B.7",
	],
	"US.3": ["US.3.B.1", "US.3.B.2"],
	"US.4": ["US.4.B.1", "US.4.B.2", "US.4.B.3", "US.4.B.4"],
	"DV.1": ["DV.1.B.1", "DV.1.B.2", "DV.1.B.3", "DV.1.B.4", "DV.1.B.5"],
	"DV.2": ["DV.2.B.1", "DV.2.B.2", "DV.2.B.3", "DV.2.B.4", "DV.2.B.5"],
	"DV.3": ["DV.3.B.1", "DV.3.B.2", "DV.3.B.3"],
	"AW.1": [
		"AW.1.B.1",
		"AW.1.B.2",
		"AW.1.B.3",
		"AW.1.B.4",
		"AW.1.B.5",
		"AW.1.B.6",
		"AW.1.B.7",
		"AW.1.B.8",
	],
	"AW.2": ["AW.2.B.1", "AW.2.B.2", "AW.2.B.3", "AW.2.B.4", "AW.2.B.5"],
	"AW.3": ["AW.3.B.1", "AW.3.B.2", "AW.3.B.3", "AW.3.B.4"],
	"DT.1": ["DT.1.B.1", "DT.1.B.2", "DT.1.B.3"],
	"DT.2": ["DT.2.B.1", "DT.2.B.2", "DT.2.B.3"],
	"DT.3": ["DT.3.B.1", "DT.3.B.2", "DT.3.B.3"],
	"DT.4": ["DT.4.B.1", "DT.4.B.2", "DT.4.B.3", "DT.4.B.4", "DT.4.B.5"],
	"NE.1": ["NE.1.B.1", "NE.1.B.2", "NE.1.B.3"],
	"NE.2": ["NE.2.B.1", "NE.2.B.2", "NE.2.B.3"],
	"NE.3": ["NE.3.B.1", "NE.3.B.2", "NE.3.B.3"],
	"AO.1": ["AO.1.B.1", "AO.1.B.2"],
	"AO.2": ["AO.2.B.1", "AO.2.B.2"],
	"VA.1": ["VA.1.B.1", "VA.1.B.2", "VA.1.B.3", "VA.1.B.4"],
	"VA.2": ["VA.2.B.1"],
	"VA.3": ["VA.3.B.1", "VA.3.B.2"],
	"VA.4": ["VA.4.B.1"],
};

async function main() {
	const connectionString = process.env.DATABASE_URL;
	if (!connectionString) {
		throw new Error("DATABASE_URL is not set");
	}

	const pool = new Pool({ connectionString });
	const db = drizzle(pool, {
		schema: {
			pillars,
			capabilities,
			measurableOutcomes,
			projects,
			implementationStatements,
		},
	});

	await db
		.insert(pillars)
		.values([...PILLARS])
		.onConflictDoUpdate({
			target: pillars.code,
			set: {
				name: sql`excluded.name`,
				description: sql`excluded.description`,
				sortOrder: sql`excluded.sort_order`,
			},
		});

	const pillarRows = await db
		.select({ id: pillars.id, code: pillars.code })
		.from(pillars)
		.orderBy(pillars.sortOrder);
	console.log(
		`Seeded ${pillarRows.length} pillars: ${pillarRows.map((row) => row.code).join(", ")}`,
	);

	let capabilityCount = 0;
	for (const pillar of pillarRows) {
		const items = CAPABILITIES_BY_PILLAR[pillar.code] ?? [];
		for (const item of items) {
			await db
				.insert(capabilities)
				.values({
					pillarId: pillar.id,
					code: item.code,
					name: item.name,
					definition: LOREM_IPSUM,
				})
				.onConflictDoUpdate({
					target: capabilities.code,
					set: {
						pillarId: pillar.id,
						name: item.name,
						definition: LOREM_IPSUM,
					},
				});
			capabilityCount += 1;
		}
	}
	console.log(`Seeded ${capabilityCount} DoD Zero Trust capabilities`);

	await db.delete(implementationStatements);
	await db.delete(measurableOutcomes);

	const seededCapabilityCodes = new Set(
		Object.values(CAPABILITIES_BY_PILLAR).flatMap((items) =>
			items.map((item) => item.code),
		),
	);
	const existingCapabilities = await db
		.select({ id: capabilities.id, code: capabilities.code })
		.from(capabilities);
	for (const capability of existingCapabilities) {
		if (!seededCapabilityCodes.has(capability.code)) {
			await db.delete(capabilities).where(eq(capabilities.id, capability.id));
			console.log(`Removed obsolete capability ${capability.code}`);
		}
	}

	const capabilityRows = await db
		.select({ id: capabilities.id, code: capabilities.code })
		.from(capabilities)
		.orderBy(capabilities.code);

	const capabilityByCode = new Map(
		capabilityRows.map((row) => [row.code, row.id] as const),
	);

	let outcomeCount = 0;
	for (const [capabilityCode, outcomeCodes] of Object.entries(
		MEASURABLE_OUTCOMES_BY_CAPABILITY,
	)) {
		const capabilityId = capabilityByCode.get(capabilityCode);
		if (!capabilityId) {
			throw new Error(`Capability "${capabilityCode}" was not seeded`);
		}

		for (const code of outcomeCodes) {
			await db.insert(measurableOutcomes).values({
				capabilityId,
				code,
				definition: LOREM_IPSUM,
				ztLevel: "basic",
			});
			outcomeCount += 1;
		}
	}
	console.log(`Seeded ${outcomeCount} measurable outcomes`);

	const existingProject = await db.query.projects.findFirst({
		where: eq(projects.name, SAMPLE_PROJECT.name),
	});

	let project;
	if (existingProject) {
		const [updated] = await db
			.update(projects)
			.set({
				governmentItpm: SAMPLE_PROJECT.governmentItpm,
				divisionOwner: SAMPLE_PROJECT.divisionOwner,
				updatedAt: new Date(),
			})
			.where(eq(projects.id, existingProject.id))
			.returning();
		project = updated;
	} else {
		const [created] = await db.insert(projects).values(SAMPLE_PROJECT).returning();
		project = created;
	}

	const outcomeRows = await db
		.select({ id: measurableOutcomes.id })
		.from(measurableOutcomes);
	if (outcomeRows.length > 0) {
		await db.insert(implementationStatements).values(
			outcomeRows.map((outcome) => ({
				projectId: project.id,
				measurableOutcomeId: outcome.id,
				status: "not_started" as const,
				statement: null,
			})),
		);
	}

	console.log(
		`Seeded project "${project.name}" with ${outcomeRows.length} not_started statements`,
	);

	await pool.end();
}

main().catch((error: unknown) => {
	console.error(error);
	process.exit(1);
});
