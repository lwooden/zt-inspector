import { AssistantChat } from "@/components/assistant-chat";

export default function ZtAssistantPage() {
	return (
		<div className="flex flex-col gap-6">
			<div>
				<h1 className="text-2xl font-semibold tracking-tight text-foreground">
					ZT Assistant
				</h1>
				<p className="mt-1 text-sm text-muted">
					Ask natural-language questions about data available to ZT Inspector.
				</p>
			</div>
			<AssistantChat />
		</div>
	);
}
