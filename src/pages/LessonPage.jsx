import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import MarkdownRenderer from '../components/MarkdownRenderer';
import { fetchLessonById, incrementLessonViews } from '../services/lessonService';

function normalizeCodeSnippets(rawSnippets) {
  if (!Array.isArray(rawSnippets)) return [];

  return rawSnippets
    .map((snippet, index) => {
      if (typeof snippet === 'string') {
        return {
          id: `snippet-${index}`,
          code: snippet,
          language: 'javascript',
          title: `Code Snippet ${index + 1}`,
        };
      }

      if (snippet && typeof snippet === 'object') {
        return {
          id: snippet.id ?? `snippet-${index}`,
          code: snippet.code ?? snippet.content ?? '',
          language: snippet.language ?? snippet.lang ?? 'javascript',
          title: snippet.title ?? snippet.name ?? `Code Snippet ${index + 1}`,
        };
      }

      return null;
    })
    .filter((snippet) => snippet?.code);
}

function LessonPage() {
  const { id } = useParams();
  const [lesson, setLesson] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadLesson() {
      try {
        const data = await fetchLessonById(id);
        setLesson(data);
        await incrementLessonViews(data.id);
      } catch (err) {
        setError(err.message);
      }
    }

    loadLesson();
  }, [id]);

  const codeSnippets = useMemo(() => normalizeCodeSnippets(lesson?.code_snippets), [lesson?.code_snippets]);

  if (error) return <p className="text-red-600">{error}</p>;
  if (!lesson) return <p className="text-slate-600">Loading lesson...</p>;

  return (
    <article className="space-y-5">
      <h1 className="text-3xl font-bold">{lesson.title}</h1>
      <div className="flex flex-wrap gap-2 text-xs font-medium text-indigo-700">
        <span className="rounded bg-indigo-50 px-2 py-1">{lesson.categories?.name}</span>
        {(lesson.lesson_tags ?? []).map((entry) => (
          <span key={entry.tags.name} className="rounded bg-slate-100 px-2 py-1 text-slate-700">
            {entry.tags.name}
          </span>
        ))}
      </div>

      <MarkdownRenderer content={lesson.content} />

      {codeSnippets.length > 0 && (
        <section className="space-y-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-xl font-semibold">Code Snippets</h2>
          {codeSnippets.map((snippet) => (
            <div key={snippet.id} className="space-y-2">
              <p className="text-sm font-medium text-slate-600">{snippet.title}</p>
              <MarkdownRenderer content={`\`\`\`${snippet.language}\n${snippet.code}\n\`\`\``} />
            </div>
          ))}
        </section>
      )}
    </article>
  );
}

export default LessonPage;
