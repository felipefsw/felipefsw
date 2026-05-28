"use client";

import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";

const components: Components = {
  h1: (p) => <h1 className="mb-3 mt-1 text-lg font-bold text-gray-900" {...p} />,
  h2: (p) => <h2 className="mb-2 mt-5 text-base font-semibold text-gray-900" {...p} />,
  h3: (p) => <h3 className="mb-1.5 mt-4 text-sm font-semibold text-gray-900" {...p} />,
  p: (p) => <p className="my-2 text-sm leading-relaxed text-gray-800" {...p} />,
  ul: (p) => <ul className="my-2 ml-5 list-disc space-y-1 text-sm text-gray-800" {...p} />,
  ol: (p) => <ol className="my-2 ml-5 list-decimal space-y-1 text-sm text-gray-800" {...p} />,
  li: (p) => <li className="leading-relaxed" {...p} />,
  strong: (p) => <strong className="font-semibold text-gray-900" {...p} />,
  blockquote: (p) => (
    <blockquote
      className="my-3 border-l-4 border-orange-300 bg-orange-50 px-3 py-2 text-sm text-gray-800"
      {...p}
    />
  ),
  code: (p) => (
    <code className="rounded bg-gray-100 px-1 py-0.5 font-mono text-xs text-gray-900" {...p} />
  ),
  table: (p) => (
    <div className="my-3 overflow-x-auto">
      <table className="w-full border-collapse text-xs" {...p} />
    </div>
  ),
  thead: (p) => <thead className="bg-gray-50" {...p} />,
  th: (p) => (
    <th
      className="border-b border-gray-200 px-2 py-1.5 text-left font-semibold text-gray-900"
      {...p}
    />
  ),
  td: (p) => <td className="border-t border-gray-100 px-2 py-1.5 align-top text-gray-800" {...p} />,
  hr: (p) => <hr className="my-4 border-gray-200" {...p} />,
};

export default function MarkdownView({ children }: { children: string }) {
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
      {children}
    </ReactMarkdown>
  );
}
