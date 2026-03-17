import { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Prism from 'prismjs';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-jsx';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-tsx';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-sql';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-markup';

function CodeBlock({ className, children }) {
  const [copied, setCopied] = useState(false);
  const language = (className ?? '').replace('language-', '') || 'code';
  const code = String(children).replace(/\n$/, '');

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="group relative overflow-hidden rounded-xl border border-slate-700 bg-slate-950 shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-700/80 bg-slate-900 px-3 py-2 text-xs text-slate-200">
        <span className="rounded bg-slate-800 px-2 py-0.5 font-semibold uppercase tracking-wide">{language}</span>
        <button
          type="button"
          onClick={handleCopy}
          className="rounded bg-slate-700 px-2.5 py-1 text-xs transition hover:bg-slate-600"
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <pre className="max-w-full overflow-x-auto p-4 text-sm leading-6 text-slate-100">
        <code className={className}>{children}</code>
      </pre>
    </div>
  );
}

function MarkdownRenderer({ content }) {
  useEffect(() => {
    Prism.highlightAll();
  }, [content]);

  return (
    <div className="prose prose-slate max-w-none text-[17px] leading-8 prose-headings:font-bold prose-headings:tracking-tight prose-a:text-indigo-600 prose-a:transition hover:prose-a:text-indigo-700 prose-strong:text-slate-900 prose-blockquote:rounded-r-lg prose-blockquote:border-l-4 prose-blockquote:border-indigo-200 prose-blockquote:bg-slate-50 prose-blockquote:px-4 prose-blockquote:py-1 prose-blockquote:italic prose-img:rounded-xl prose-pre:bg-transparent prose-pre:p-0">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ className, children, ...props }) {
            const inline = !className;
            if (inline) return <code {...props}>{children}</code>;
            return <CodeBlock className={className}>{children}</CodeBlock>;
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

export default MarkdownRenderer;
