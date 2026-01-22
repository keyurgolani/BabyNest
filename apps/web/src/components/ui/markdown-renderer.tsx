"use client";

import React from "react";
import ReactMarkdown from "react-markdown";

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export function MarkdownRenderer({ content, className = "" }: MarkdownRendererProps) {
  return (
    <div className={`prose prose-sm max-w-none dark:prose-invert 
      prose-headings:font-semibold prose-headings:text-foreground
      prose-p:text-foreground/80 prose-p:leading-relaxed
      prose-strong:text-foreground prose-strong:font-semibold
      prose-ul:text-foreground/80 prose-ol:text-foreground/80
      prose-li:marker:text-muted-foreground
      ${className}`}
    >
      <ReactMarkdown
        components={{
          p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
          ul: ({ children }) => <ul className="mb-2 pl-4 list-disc">{children}</ul>,
          ol: ({ children }) => <ol className="mb-2 pl-4 list-decimal">{children}</ol>,
          li: ({ children }) => <li className="mb-1">{children}</li>,
          strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
          h1: ({ children }) => <h1 className="text-lg font-bold mb-2 text-foreground">{children}</h1>,
          h2: ({ children }) => <h2 className="text-base font-semibold mb-2 text-foreground">{children}</h2>,
          h3: ({ children }) => <h3 className="text-sm font-semibold mb-1 text-foreground">{children}</h3>,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
