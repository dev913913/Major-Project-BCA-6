import { useEffect } from 'react';
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

function MarkdownRenderer({ content }) {
  useEffect(() => {
    Prism.highlightAll();
  }, [content]);

  return (
    <div className="prose prose-slate max-w-none rounded-lg bg-white p-6 shadow-sm prose-pre:bg-slate-900 prose-pre:text-slate-100">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  );
}

export default MarkdownRenderer;
