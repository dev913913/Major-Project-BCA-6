import { useMemo, useState } from 'react';
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

const LANGUAGE_ALIASES = {
  js: 'javascript',
  jsx: 'jsx',
  ts: 'typescript',
  tsx: 'tsx',
  py: 'python',
  sh: 'bash',
  shell: 'bash',
};

function normalizeLanguage(className) {
  const raw = (className ?? '').replace('language-', '').toLowerCase();
  const mapped = LANGUAGE_ALIASES[raw] ?? raw;
  return mapped || 'javascript';
}

function CodeBlock({ className, children }) {
  const [copied, setCopied] = useState(false);
  const language = normalizeLanguage(className);
  const code = String(children).replace(/\n$/, '');

  const highlightedCode = useMemo(() => {
    const grammar = Prism.languages[language] ?? Prism.languages.javascript;

    try {
      return Prism.highlight(code, grammar, language);
    } catch {
      return Prism.util.encode(code);
    }
  }, [code, language]);

  async function handleCopy() {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  }

  return (
    <div className="group relative my-5 overflow-hidden rounded-xl border border-slate-700 bg-slate-900 shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-700/80 px-4 py-2 text-xs text-slate-300">
        <span className="uppercase tracking-wide">{language}</span>
        <button
          type="button"
          onClick={handleCopy}
          className="rounded bg-slate-700 px-2 py-1 text-xs transition hover:bg-slate-600"
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>

      <pre className="overflow-x-auto px-4 py-4 text-left text-sm leading-7 sm:pl-12 sm:pr-7 sm:py-5">
        <code
          className={`language-${language} block min-w-max`}
          dangerouslySetInnerHTML={{ __html: highlightedCode }}
        />
      </pre>
    </div>
  );
}

function MarkdownRenderer({ content }) {
  const safeContent = typeof content === 'string' ? content : content == null ? '' : String(content);

  return (
    <div className="prose prose-slate max-w-none overflow-x-hidden rounded-2xl bg-white p-4 text-[17px] leading-8 shadow-sm prose-headings:font-bold prose-a:text-indigo-600 prose-a:transition hover:prose-a:text-indigo-700 prose-blockquote:rounded-r-lg prose-blockquote:border-l-4 prose-blockquote:border-indigo-200 prose-blockquote:bg-slate-50 prose-blockquote:px-4 prose-blockquote:py-1 prose-blockquote:italic prose-img:rounded-xl prose-img:max-w-full prose-pre:my-6 prose-pre:mx-0 prose-pre:max-w-full prose-pre:bg-transparent prose-code:break-words prose-code:before:hidden prose-code:after:hidden prose-p:break-words prose-li:break-words sm:p-6">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ className, children, ...props }) {
            const inline = !className;
            if (inline) return <code {...props}>{children}</code>;
            return <CodeBlock className={className}>{children}</CodeBlock>;
          },
          table({ children }) {
            return (
              <div className="my-4 overflow-x-auto">
                <table>{children}</table>
              </div>
            );
          },
        }}
      >
        {safeContent}
      </ReactMarkdown>
    </div>
  );
}

export default MarkdownRenderer;
