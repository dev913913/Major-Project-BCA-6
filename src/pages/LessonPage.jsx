import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import MarkdownRenderer from '../components/MarkdownRenderer';
import LessonCard from '../components/LessonCard';
import { JsonLd, useSeo } from '../components/Seo';
import { fetchLessonById, fetchPublishedLessons, incrementLessonViews } from '../services/lessonService';
import { friendlyErrorMessage, reportError } from '../utils/errorUtils';

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
        reportError('LessonPage load', err);
        setError(friendlyErrorMessage('We could not open this lesson right now. Please try again.'));
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

  const readingTime = useMemo(() => wordsToMinutes(lesson?.content), [lesson?.content]);

  if (error) return <p className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">{error}</p>;
  if (!lesson) return <div className="h-64 animate-pulse rounded-2xl bg-slate-100" />;

  return (
    <article className="mx-auto max-w-5xl space-y-8 pb-8">
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

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
        <Link to="/lessons" className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600">← Back to Lessons</Link>

        <header className="mt-4 space-y-4 border-b border-slate-100 pb-6">
          <span className="inline-flex rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-indigo-700">
            {lesson.categories?.name ?? 'General'}
          </span>
          <h1 className="text-3xl font-black leading-tight text-slate-900 sm:text-5xl">{lesson.title}</h1>
          <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-500">
            <span>📅 {new Date(lesson.created_at).toLocaleDateString()}</span>
            <span>👁 {lesson.views_count ?? 0} views</span>
            <span>🕒 {readingTime} min read</span>
            <span>✍️ By Dev Kumar</span>
          </div>
          {lesson.featured_image && (
            <img
              src={lesson.featured_image}
              alt={lesson.title}
              className="mt-2 h-72 w-full rounded-2xl border border-slate-100 object-cover"
              loading="lazy"
            />
          )}
        </header>

        <section className="mt-8">
          <MarkdownRenderer content={lesson.content} />
        </section>
      </div>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold">You Might Also Like</h2>
        {relatedLessons.length === 0 ? (
          <p className="rounded-lg border border-dashed border-slate-300 p-4 text-sm text-slate-500">No related lessons available yet.</p>
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
