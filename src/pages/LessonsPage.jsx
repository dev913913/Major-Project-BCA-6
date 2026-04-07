import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import LessonCard from '../components/LessonCard';
import ErrorState from '../components/ErrorState';
import { useSeo } from '../components/Seo';
import { fetchPublishedLessons } from '../services/lessonService';
import { friendlyErrorMessage, reportError } from '../utils/errorUtils';

const SORT_OPTIONS = [
  { value: 'recent', label: 'Most recent' },
  { value: 'popular', label: 'Most viewed' },
  { value: 'title', label: 'Title (A-Z)' },
];

function normalizeSort(value) {
  return SORT_OPTIONS.some((option) => option.value === value) ? value : 'recent';
}

function LessonsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const searchParamsString = searchParams.toString();
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState(searchParams.get('q') ?? '');
  const [activeCategory, setActiveCategory] = useState(searchParams.get('category') ?? 'all');
  const [sortBy, setSortBy] = useState(normalizeSort(searchParams.get('sort')));

  useSeo({
    title: 'Explore Lessons | Codev by Dev Kumar',
    description: 'Curated programming lessons by Dev Kumar with practical examples and modern explanations.',
    type: 'website',
    url: typeof window !== 'undefined' ? window.location.href : undefined,
  });

  useEffect(() => {
    const nextParams = new URLSearchParams(searchParamsString);

    if (query) nextParams.set('q', query);
    else nextParams.delete('q');

    if (activeCategory !== 'all') nextParams.set('category', activeCategory);
    else nextParams.delete('category');

    if (sortBy !== 'recent') nextParams.set('sort', sortBy);
    else nextParams.delete('sort');

    if (nextParams.toString() !== searchParamsString) {
      setSearchParams(nextParams, { replace: true });
    }
  }, [query, activeCategory, sortBy, searchParamsString, setSearchParams]);

  const loadLessons = useCallback(() => {
    setLoading(true);
    setError('');

    fetchPublishedLessons()
      .then(setLessons)
      .catch((err) => {
        reportError('LessonsPage load', err);
        setError(friendlyErrorMessage('Unable to load lessons right now. Please try again.'));
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadLessons();
  }, [loadLessons]);

  const categories = useMemo(() => {
    const names = new Set(lessons.map((lesson) => lesson.categories?.name).filter(Boolean));
    return ['all', ...names];
  }, [lessons]);

  const categoryCounts = useMemo(() => {
    const counts = new Map();
    lessons.forEach((lesson) => {
      const name = lesson.categories?.name;
      if (name) {
        counts.set(name, (counts.get(name) ?? 0) + 1);
      }
    });
    return counts;
  }, [lessons]);

  const filteredLessons = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    const filtered = lessons.filter((lesson) => {
      const title = lesson.title?.toLowerCase() ?? '';
      const content = lesson.content?.toLowerCase() ?? '';
      const matchesQuery = !normalizedQuery || title.includes(normalizedQuery) || content.includes(normalizedQuery);
      const matchesCategory = activeCategory === 'all' || lesson.categories?.name === activeCategory;
      return matchesQuery && matchesCategory;
    });

    if (sortBy === 'popular') {
      return [...filtered].sort((a, b) => (b.views_count ?? 0) - (a.views_count ?? 0));
    }

    if (sortBy === 'title') {
      return [...filtered].sort((a, b) => (a.title ?? '').localeCompare(b.title ?? ''));
    }

    return [...filtered].sort((a, b) => {
      const aDate = new Date(a.created_at ?? 0).getTime();
      const bDate = new Date(b.created_at ?? 0).getTime();
      return bDate - aDate;
    });
  }, [lessons, query, activeCategory, sortBy]);

  function clearFilters() {
    setQuery('');
    setActiveCategory('all');
    setSortBy('recent');
  }

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
              aria-label="Search lessons by title"
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
                {category === 'all'
                  ? `All categories (${lessons.length})`
                  : `${category} (${categoryCounts.get(category) ?? 0})`}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-slate-600">
              Showing <strong>{filteredLessons.length}</strong> of <strong>{lessons.length}</strong> lessons
            </p>

            <div className="flex flex-wrap items-center gap-2">
              <label htmlFor="sortBy" className="text-sm font-medium text-slate-700">
                Sort by
              </label>
              <select
                id="sortBy"
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none ring-indigo-200 transition focus:ring"
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={clearFilters}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      </header>

      {error && <ErrorState message={error} onRetry={loadLessons} />}

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
          <p className="mt-2 text-slate-500">Try a different search or filter, or reset your selections.</p>
          <button
            type="button"
            onClick={clearFilters}
            className="mt-6 inline-flex rounded-full bg-indigo-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700"
          >
            Reset filters
          </button>
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
