"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useMemo, useState, type FormEvent } from "react";
import { AssistantMarkdown } from "@/components/assistant-markdown";
import { Button } from "@/components/ui/button";

const PROMPT_STARTERS = [
	"What projects are available to inspect?",
	"Summarize pillar posture for the first project.",
	"Which pillars are still at none for that project?",
	"How is the User pillar progressing at the basic tier?",
] as const;

function messageText(message: UIMessage) {
	return message.parts
		.filter(
			(part): part is { type: "text"; text: string } => part.type === "text",
		)
		.map((part) => part.text)
		.join("");
}

function hasActiveTool(message: UIMessage | undefined) {
	if (!message) return false;
	return message.parts.some((part) => {
		if (part.type !== "dynamic-tool" && !part.type.startsWith("tool-"))
			return false;
		if ("state" in part) {
			return (
				part.state === "input-streaming" || part.state === "input-available"
			);
		}
		return false;
	});
}

export function AssistantChat() {
	const transport = useMemo(
		() => new DefaultChatTransport({ api: "/api/chat" }),
		[],
	);
	const { messages, sendMessage, status, error, clearError, stop } = useChat({
		transport,
	});
	const [input, setInput] = useState("");

	const pending = status === "submitted" || status === "streaming";
	const lastMessage = messages[messages.length - 1];
	const toolRunning = hasActiveTool(lastMessage);

	async function sendPrompt(text: string) {
		const trimmed = text.trim();
		if (!trimmed || pending) return;
		clearError();
		setInput("");
		await sendMessage({ text: trimmed });
	}

	async function onSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		await sendPrompt(input);
	}

	return (
		<div className="flex min-h-[28rem] flex-col border border-border bg-surface">
			<div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
				{messages.length === 0 ? (
					<div className="flex flex-col gap-4">
						<div>
							<p className="text-sm text-muted">
								Ask about projects within ZT Inspector, or start with one of
								these:
							</p>
						</div>
						<div className="flex flex-col gap-2">
							{PROMPT_STARTERS.map((prompt) => (
								<button
									key={prompt}
									type="button"
									disabled={pending}
									onClick={() => void sendPrompt(prompt)}
									className="border border-border bg-background px-3 py-2.5 text-left text-sm text-foreground transition-colors hover:border-accent hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:pointer-events-none disabled:opacity-50"
								>
									{prompt}
								</button>
							))}
						</div>
					</div>
				) : (
					messages.map((message) => {
						const text = messageText(message);
						const isUser = message.role === "user";

						if (!text && message.role === "assistant") {
							return (
								<div key={message.id} className="text-sm">
									<p className="font-medium text-muted">ZT-Assistant</p>
									<p className="mt-1 text-muted">…</p>
								</div>
							);
						}
						if (!text) return null;

						return (
							<div
								key={message.id}
								className={
									isUser
										? "ml-8 border border-border bg-background px-3 py-3"
										: "mr-4"
								}
							>
								<p className="text-xs font-medium uppercase tracking-wide text-muted">
									{isUser ? "You" : "ZT-Assistant"}
								</p>
								<div className="mt-1.5">
									{isUser ? (
										<p className="whitespace-pre-wrap text-sm leading-6 text-foreground">
											{text}
										</p>
									) : (
										<AssistantMarkdown content={text} />
									)}
								</div>
							</div>
						);
					})
				)}
				{toolRunning ? (
					<p className="text-xs text-muted">Looking up dashboard data…</p>
				) : null}
			</div>

			{error ? (
				<p className="border-t border-border px-4 py-3 text-sm text-red-700">
					{error.message}
				</p>
			) : null}

			<form
				onSubmit={onSubmit}
				className="flex flex-col gap-3 border-t border-border px-4 py-4 sm:flex-row sm:items-end"
			>
				<label className="block min-w-0 flex-1 text-sm">
					<span className="sr-only">Message</span>
					<textarea
						className="mt-0 min-h-20 w-full resize-y border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent focus:ring-1 focus:ring-accent"
						value={input}
						onChange={(event) => setInput(event.target.value)}
						placeholder="Ask a question…"
						disabled={pending}
					/>
				</label>
				<div className="flex gap-2">
					{pending ? (
						<Button type="button" variant="secondary" onClick={() => stop()}>
							Stop
						</Button>
					) : null}
					<Button type="submit" disabled={pending || input.trim() === ""}>
						{pending ? "Sending…" : "Send"}
					</Button>
				</div>
			</form>
		</div>
	);
}
