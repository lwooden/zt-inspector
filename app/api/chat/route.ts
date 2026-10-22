import { createMCPClient } from "@ai-sdk/mcp";
import {
	convertToModelMessages,
	stepCountIs,
	streamText,
	type UIMessage,
} from "ai";
import { getLanguageModel, getMcpServerUrl } from "@/lib/llm";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(request: Request) {
	let messages: UIMessage[];
	try {
		const body = (await request.json()) as { messages?: UIMessage[] };
		messages = body.messages ?? [];
	} catch {
		return Response.json({ error: "Invalid JSON body" }, { status: 400 });
	}

	if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
		return Response.json(
			{ error: "GOOGLE_GENERATIVE_AI_API_KEY is not configured" },
			{ status: 500 },
		);
	}

	const mcpClient = await createMCPClient({
		transport: {
			type: "http",
			url: getMcpServerUrl(),
		},
	});

	try {
		const tools = await mcpClient.tools();
		const result = streamText({
			model: getLanguageModel(),
			system: [
				"You are ZT-Assistant for the ZT Inspector.",
				"Use tools to look up data available in the ZT Inspector Platform. Be concise and factual.",
				"Use listEnvironments to discover environments, then getEnvironmentPosture with an environmentId for that environment's pillar maturity.",
				"Use listProjects to discover projects, then getProjectPosture with a projectId for pillar maturity.",
				"Format answers in clean Markdown for the chat UI:",
				"- Prefer a short intro sentence, then a bullet list.",
				"- For environments: one top-level bullet `**Name**`, then a nested bullet for description.",
				"- For projects: one top-level bullet `**Name**`, then nested bullets for ITPM and division.",
				"- For posture: one top-level bullet per pillar `**Pillar name**`, then nested bullets for",
				"  achieved level and brief basic/intermediate/advanced progress (mean % vs target, met/in progress/not started).",
				"- Do not dump raw JSON. Do not use headings unless summarizing many sections.",
				"- Emphasize names with bold; keep field labels plain.",
				"If the question is not about ZT Inspector, answer that you are not aware of the information and suggest that they use another tool.",
			].join(" "),
			messages: await convertToModelMessages(messages),
			tools,
			stopWhen: stepCountIs(5),
			onFinish: async () => {
				await mcpClient.close();
			},
		});

		return result.toUIMessageStreamResponse();
	} catch (error) {
		await mcpClient.close().catch(() => undefined);
		const message =
			error instanceof Error ? error.message : "Failed to generate response";
		return Response.json({ error: message }, { status: 500 });
	}
}
