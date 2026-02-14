import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import MarkdownRenderer from '../components/MarkdownRenderer';
import LessonCard from '../components/LessonCard';
import { JsonLd, useSeo } from '../components/Seo';
import { fetchLessonById, fetchPublishedLessons, incrementLessonViews } from '../services/lessonService';

function normalizeCodeSnippets(rawSnippets) {
  if (!Array.isArray(rawSnippets)) return [];

  return rawSnippets
    .map((snippet, index) => {
      if (typeof snippet === 'string') {
        return { id: `snippet-${index}`, code: snippet, language: 'javascript', title: `Code Snippet ${index + 1}` };
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

function wordsToMinutes(content) {
  const words = (content ?? '').split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

function LessonPage() {
  const { id } = useParams();
  const [lesson, setLesson] = useState(null);
  const [relatedLessons, setRelatedLessons] = useState([]);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState(0);

  useSeo({
    title: lesson ? `${lesson.title} | ProgLearn by Dev Kumar` : 'Lesson | ProgLearn by Dev Kumar',
    description: lesson?.content?.slice(0, 150) ?? 'Programming lesson by Dev Kumar on ProgLearn.',
    type: 'article',
    image: lesson?.featured_image,
    url: typeof window !== 'undefined' ? window.location.href : undefined,
  });

  useEffect(() => {
    async function loadLesson() {
      try {
        const data = await fetchLessonById(id);
        setLesson(data);
        await incrementLessonViews(data.id);
        const allLessons = await fetchPublishedLessons();
        setRelatedLessons(
          allLessons
            .filter((entry) => entry.id !== data.id && entry.categories?.name === data.categories?.name)
            .slice(0, 3),
        );
      } catch (err) {
        setError(err.message ?? 'Failed to load lesson.');
      }
    }

    loadLesson();
  }, [id]);

  useEffect(() => {
    const onScroll = () => {
      const fullHeight = document.documentElement.scrollHeight - window.innerHeight;
      const ratio = fullHeight > 0 ? (window.scrollY / fullHeight) * 100 : 0;
      setProgress(Math.min(100, Math.max(0, ratio)));
    };

    window.addEventListener('scroll', onScroll);
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const codeSnippets = useMemo(() => normalizeCodeSnippets(lesson?.code_snippets), [lesson?.code_snippets]);
  const readingTime = useMemo(() => wordsToMinutes(lesson?.content), [lesson?.content]);

  if (error) return <p className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">{error}</p>;
  if (!lesson) return <div className="h-64 animate-pulse rounded-2xl bg-slate-100" />;

  return (
    <article className="space-y-8">
      <JsonLd
        id={`lesson-jsonld-${lesson.id}`}
        data={{
          '@context': 'https://schema.org',
          '@type': 'Article',
          headline: lesson.title,
          author: { '@type': 'Person', name: 'Dev Kumar' },
          datePublished: lesson.created_at,
          dateModified: lesson.updated_at,
          image: lesson.featured_image,
          articleSection: lesson.categories?.name,
        }}
      />

      <div className="fixed left-0 top-0 z-[60] h-1 bg-indigo-600 transition-all" style={{ width: `${progress}%` }} />

      <Link to="/lessons" className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600">← Back to Lessons</Link>

      <header className="relative overflow-hidden rounded-3xl bg-slate-900 text-white">
        {lesson.featured_image && (
          <img src={lesson.featured_image} alt={lesson.title} className="h-72 w-full object-cover opacity-40" loading="lazy" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/70 to-slate-900/20" />
        <div className="absolute inset-0 flex flex-col justify-end p-6 sm:p-10">
          <span className="mb-3 inline-flex w-fit rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide">{lesson.categories?.name ?? 'General'}</span>
          <h1 className="max-w-4xl text-3xl font-black leading-tight sm:text-5xl">{lesson.title}</h1>
          <div className="mt-4 flex flex-wrap gap-3 text-sm text-slate-200">
            <span>📅 {new Date(lesson.created_at).toLocaleDateString()}</span>
            <span>👁 {lesson.views_count ?? 0} views</span>
            <span>🕒 {readingTime} min read</span>
            <span>✍️ By Dev Kumar</span>
          </div>
        </div>
      </header>

      <div className="grid gap-8 lg:grid-cols-[1fr,280px]">
        <div className="space-y-6">
          <MarkdownRenderer content={lesson.content} />

          {codeSnippets.length > 0 && (
            <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-2xl font-bold">Code Snippets</h2>
              {codeSnippets.map((snippet) => (
                <div key={snippet.id} className="space-y-2">
                  <p className="text-sm font-semibold text-slate-600">{snippet.title}</p>
                  <MarkdownRenderer content={`\`\`\`${snippet.language}\n${snippet.code}\n\`\`\``} />
                </div>
              ))}
            </section>
          )}
        </div>

        <aside className="hidden lg:block">
          <div className="sticky top-24 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">Article info</h2>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              <li>Author: Dev Kumar</li>
              <li>Category: {lesson.categories?.name ?? 'General'}</li>
              <li>Reading time: {readingTime} minutes</li>
            </ul>
          </div>
        </aside>
      </div>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold">You Might Also Like</h2>
        {relatedLessons.length === 0 ? (
          <p className="text-sm text-slate-500">No related lessons available yet.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-3">
            {relatedLessons.map((relatedLesson) => (
              <LessonCard key={relatedLesson.id} lesson={relatedLesson} />
            ))}
          </div>
        )}
      </section>
    </article>
  );
}

export default LessonPage;
