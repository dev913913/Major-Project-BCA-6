import { useEffect, useMemo, useState } from 'react';
import LessonCard from '../components/LessonCard';
import { useSeo } from '../components/Seo';
import { fetchPublishedLessons } from '../services/lessonService';

function LessonsPage() {
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');

  useSeo({
    title: 'Explore Lessons | ProgLearn by Dev Kumar',
    description: 'Curated programming lessons by Dev Kumar with practical examples and modern explanations.',
    type: 'website',
    url: typeof window !== 'undefined' ? window.location.href : undefined,
  });

  useEffect(() => {
    fetchPublishedLessons()
      .then(setLessons)
      .catch((err) => setError(err.message ?? 'Failed to load lessons.'))
      .finally(() => setLoading(false));
  }, []);

  const categories = useMemo(() => {
    const names = new Set(lessons.map((lesson) => lesson.categories?.name).filter(Boolean));
    return ['all', ...names];
  }, [lessons]);

  const filteredLessons = useMemo(() => {
    return lessons.filter((lesson) => {
      const matchesQuery = lesson.title.toLowerCase().includes(query.toLowerCase());
      const matchesCategory = activeCategory === 'all' || lesson.categories?.name === activeCategory;
      return matchesQuery && matchesCategory;
    });
  }, [lessons, query, activeCategory]);

  return (
    <section className="space-y-8">
      <header className="rounded-3xl bg-white p-6 shadow-sm">
        <h1 className="text-4xl font-black text-slate-900">Explore Lessons</h1>
        <p className="mt-2 text-slate-600">Curated programming lessons by Dev Kumar</p>

        <div className="mt-6 grid gap-4">
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-3 text-slate-400">🔎</span>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search lessons..."
              className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-4 outline-none ring-indigo-200 transition focus:ring"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => setActiveCategory(category)}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                  activeCategory === category ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {category === 'all' ? 'All categories' : category}
              </button>
            ))}
          </div>
        </div>
      </header>

      {error && <p className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">{error}</p>}

      {loading ? (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="h-80 animate-pulse rounded-2xl bg-slate-100" />
          ))}
        </div>
      ) : filteredLessons.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <p className="text-4xl" aria-hidden="true">📚</p>
          <h2 className="mt-3 text-2xl font-bold">No lessons found</h2>
          <p className="mt-2 text-slate-500">Try different search or filter</p>
        </div>
      ) : (
        <div className="grid animate-in gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filteredLessons.map((lesson) => (
            <LessonCard key={lesson.id} lesson={lesson} />
          ))}
        </div>
      )}
    </section>
  );
}

export default LessonsPage;
