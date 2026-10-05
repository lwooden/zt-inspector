"use client";

import type { Components } from "react-markdown";
import ReactMarkdown from "react-markdown";

const components: Components = {
  p: ({ children }) => (
    <p className="my-2 text-sm leading-6 text-foreground first:mt-0 last:mb-0">
      {children}
    </p>
  ),
  strong: ({ children }) => (
    <strong className="font-semibold text-foreground">{children}</strong>
  ),
  em: ({ children }) => <em className="italic text-foreground">{children}</em>,
  ul: ({ children }) => (
    <ul className="my-2 flex list-none flex-col gap-2 p-0 first:mt-0 last:mb-0 [&_ul]:mt-1.5 [&_ul]:gap-0.5 [&_ul>li]:border-0 [&_ul>li]:bg-transparent [&_ul>li]:px-0 [&_ul>li]:py-0 [&_ul>li]:text-muted">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="my-2 flex list-decimal flex-col gap-2 pl-5 text-sm text-foreground first:mt-0 last:mb-0">
      {children}
    </ol>
  ),
  li: ({ children }) => (
    <li className="border border-border bg-background px-3 py-2 text-sm leading-6 text-foreground">
      <div className="flex flex-col gap-0.5">{children}</div>
    </li>
  ),
  h1: ({ children }) => (
    <h3 className="mt-3 mb-1 text-base font-semibold text-foreground first:mt-0">
      {children}
    </h3>
  ),
  h2: ({ children }) => (
    <h3 className="mt-3 mb-1 text-base font-semibold text-foreground first:mt-0">
      {children}
    </h3>
  ),
  h3: ({ children }) => (
    <h3 className="mt-3 mb-1 text-sm font-semibold text-foreground first:mt-0">
      {children}
    </h3>
  ),
  a: ({ href, children }) => (
    <a
      href={href}
      className="text-accent underline-offset-2 hover:underline"
      target="_blank"
      rel="noreferrer"
    >
      {children}
    </a>
  ),
  code: ({ children, className }) => {
    const isBlock = Boolean(className);
    if (isBlock) {
      return (
        <code className="mt-2 mb-2 block overflow-x-auto border border-border bg-background px-3 py-2 font-mono text-xs text-foreground">
          {children}
        </code>
      );
    }
    return (
      <code className="border border-border bg-background px-1 py-0.5 font-mono text-xs text-foreground">
        {children}
      </code>
    );
  },
  pre: ({ children }) => <pre className="my-2 overflow-x-auto">{children}</pre>,
  hr: () => <hr className="my-3 border-border" />,
};

type AssistantMarkdownProps = {
  content: string;
};

export function AssistantMarkdown({ content }: AssistantMarkdownProps) {
  return (
    <div className="assistant-markdown min-w-0">
      <ReactMarkdown components={components}>{content}</ReactMarkdown>
    </div>
  );
}
