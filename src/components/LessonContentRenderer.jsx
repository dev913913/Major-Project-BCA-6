import { useMemo } from 'react';
import DOMPurify from 'dompurify';
import MarkdownRenderer from './MarkdownRenderer';

const RICH_TEXT_WRAPPER_CLASS =
  'prose prose-slate max-w-none overflow-x-hidden rounded-2xl bg-white p-4 text-[17px] leading-8 shadow-sm prose-headings:font-bold prose-a:text-indigo-600 prose-a:transition hover:prose-a:text-indigo-700 prose-blockquote:rounded-r-lg prose-blockquote:border-l-4 prose-blockquote:border-indigo-200 prose-blockquote:bg-slate-50 prose-blockquote:px-4 prose-blockquote:py-1 prose-blockquote:italic prose-img:rounded-xl prose-img:max-w-full prose-pre:my-6 prose-pre:mx-0 prose-pre:max-w-full prose-pre:bg-transparent prose-code:break-words prose-code:before:hidden prose-code:after:hidden prose-p:break-words prose-li:break-words sm:p-6';

const HTML_SIGNATURE_REGEX = /<(?:p|div|blockquote|pre|code|h[1-6])(?:\s|>)/i;

function containsHtmlSignatures(content) {
  return HTML_SIGNATURE_REGEX.test(content ?? '');
}

function LessonContentRenderer({ content }) {
  const lessonContent = content ?? '';
  const isHtmlContent = containsHtmlSignatures(lessonContent);

  const sanitizedHtml = useMemo(() => {
    if (!isHtmlContent) return '';
    return DOMPurify.sanitize(lessonContent);
  }, [isHtmlContent, lessonContent]);

  if (!isHtmlContent) {
    return <MarkdownRenderer content={lessonContent} />;
  }

  return (
    <div className={RICH_TEXT_WRAPPER_CLASS} dangerouslySetInnerHTML={{ __html: sanitizedHtml }} />
  );
}

export default LessonContentRenderer;
