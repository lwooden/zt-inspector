import { google } from "@ai-sdk/google";
import type { LanguageModel } from "ai";

// Future: AWS Bedrock
// import { createAmazonBedrock } from "@ai-sdk/amazon-bedrock";

/**
 * Active provider is Gemini. Bedrock wiring is stubbed below for later enablement.
 */
export function getLanguageModel(): LanguageModel {
	const provider = process.env.LLM_PROVIDER ?? "gemini";

	if (provider === "bedrock") {
		// Future: AWS Bedrock
		// const bedrock = createAmazonBedrock({
		//   region: process.env.AWS_REGION,
		//   accessKeyId: process.env.AWS_ACCESS_KEY_ID,
		//   secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
		// });
		// const modelArn = process.env.BEDROCK_MODEL_ARN;
		// if (!modelArn) {
		//   throw new Error("BEDROCK_MODEL_ARN is required when LLM_PROVIDER=bedrock");
		// }
		// return bedrock(modelArn);
		throw new Error(
			"LLM_PROVIDER=bedrock is not enabled yet. Use Gemini (default) or uncomment Bedrock in lib/llm.ts.",
		);
	}

	const modelId = process.env.GEMINI_MODEL ?? "gemini-3.8-flash";
	return google(modelId);
}

export function getMcpServerUrl() {
	const base = process.env.APP_URL ?? "http://localhost:3000";
	return `${base.replace(/\/$/, "")}/api/mcp`;
}
