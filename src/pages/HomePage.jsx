import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import LessonCard from '../components/LessonCard';
import { JsonLd, useSeo } from '../components/Seo';
import { fetchPublishedLessons } from '../services/lessonService';
import { fetchCategories } from '../services/categoryService';

function HomePage() {
  const [lessons, setLessons] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useSeo({
    title: 'ProgLearn by Dev Kumar | Learn Programming with Interactive Lessons',
    description: 'Master coding through interactive lessons and hands-on practice. Created by Dev Kumar.',
    type: 'website',
    url: typeof window !== 'undefined' ? window.location.href : undefined,
  });

  useEffect(() => {
    Promise.all([fetchPublishedLessons(), fetchCategories()])
      .then(([lessonData, categoryData]) => {
        setLessons(lessonData);
        setCategories(categoryData);
      })
      .catch((err) => setError(err.message ?? 'Failed to load homepage data.'))
      .finally(() => setLoading(false));
  }, []);

  const popularLessons = useMemo(
    () => [...lessons].sort((a, b) => (b.views_count ?? 0) - (a.views_count ?? 0)).slice(0, 6),
    [lessons],
  );

  const totalViews = useMemo(() => lessons.reduce((sum, lesson) => sum + (lesson.views_count ?? 0), 0), [lessons]);

  return (
    <div className="space-y-20 pb-8">
      <JsonLd
        id="homepage-jsonld"
        data={{
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          name: 'ProgLearn',
          author: { '@type': 'Person', name: 'Dev Kumar' },
          description: 'Master coding through interactive lessons and hands-on practice.',
        }}
      />

      <section className="relative flex min-h-[85vh] items-center overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-violet-600 to-blue-500 px-6 py-20 text-white shadow-xl sm:px-10">
        <div className="absolute -right-20 -top-16 h-72 w-72 rounded-full bg-white/20 blur-3xl" aria-hidden="true" />
        <div className="absolute -bottom-20 left-0 h-80 w-80 rounded-full bg-cyan-300/20 blur-3xl" aria-hidden="true" />
        <div className="relative z-10 max-w-3xl space-y-6">
          <p className="inline-flex rounded-full bg-white/20 px-4 py-1 text-sm font-medium">Created by Dev Kumar</p>
          <h1 className="text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">Learn Programming with ProgLearn</h1>
          <p className="max-w-2xl text-lg text-indigo-50">Master coding through interactive lessons and hands-on practice.</p>
          <Link to="/lessons" className="inline-block rounded-xl bg-white px-6 py-3 font-semibold text-indigo-700 shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl">
            Browse Lessons
          </Link>
        </div>
      </section>

      <section className="space-y-6">
        <div className="text-center">
          <h2 className="text-3xl font-bold">Why learners love ProgLearn</h2>
          <p className="mt-2 text-slate-600">Professional learning experience designed by Dev Kumar.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[
            ['💻', 'Interactive Lessons', 'Learn by doing with practical code examples and guided explanations.'],
            ['📈', 'Track Progress', 'Monitor your learning journey and revisit topics anytime.'],
            ['🧠', 'Expert Content', 'Curated by Dev Kumar to focus on real-world programming skills.'],
            ['🌍', 'Free Access', 'Quality education for everyone with accessible learning resources.'],
          ].map(([icon, title, text]) => (
            <article key={title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg">
              <p className="text-3xl" aria-hidden="true">{icon}</p>
              <h3 className="mt-3 text-lg font-bold">{title}</h3>
              <p className="mt-2 text-sm text-slate-600">{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="space-y-6">
        <div className="flex items-end justify-between">
          <h2 className="text-3xl font-bold">Popular Lessons</h2>
          <Link to="/lessons" className="text-sm font-semibold text-indigo-600">View all lessons →</Link>
        </div>

        {loading ? (
          <CardSkeletonGrid count={3} />
        ) : error ? (
          <p className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">{error}</p>
        ) : popularLessons.length === 0 ? (
          <p className="rounded-lg border border-dashed border-slate-300 p-6 text-center text-slate-500">No published lessons yet.</p>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {popularLessons.map((lesson) => (
              <LessonCard key={lesson.id} lesson={lesson} featured />
            ))}
          </div>
        )}
      </section>

      <section className="rounded-3xl bg-gradient-to-r from-slate-900 to-slate-800 p-8 text-white">
        <div className="grid gap-4 sm:grid-cols-3">
          <Stat title="Total lessons available" value={lessons.length} />
          <Stat title="Total views across platform" value={totalViews} />
          <Stat title="Categories covered" value={categories.length} />
        </div>
      </section>

      <section className="rounded-3xl bg-gradient-to-r from-indigo-100 via-violet-100 to-cyan-100 p-8 text-center">
        <h2 className="text-3xl font-bold text-slate-900">Ready to Start Learning?</h2>
        <p className="mt-2 text-slate-600">Join thousands of learners mastering programming.</p>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-4">
          <Link to="/lessons" className="rounded-xl bg-indigo-600 px-6 py-3 font-semibold text-white transition hover:bg-indigo-700">Explore All Lessons</Link>
          <Link to="/categories" className="font-semibold text-indigo-700 underline-offset-4 hover:underline">View by Category</Link>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-bold">About ProgLearn</h2>
        <p className="mt-3 text-slate-600">ProgLearn is a modern coding education platform created by <strong>Dev Kumar</strong> to make programming approachable, practical, and inspiring for everyone.</p>
      </section>
    </div>
  );
}

function Stat({ title, value }) {
  return (
    <article className="rounded-2xl bg-white/10 p-5 backdrop-blur">
      <p className="text-sm text-slate-300">{title}</p>
      <p className="mt-2 text-4xl font-black">{Number(value).toLocaleString()}</p>
    </article>
  );
}

function CardSkeletonGrid({ count }) {
  return (
    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="h-80 animate-pulse rounded-2xl bg-slate-100" />
      ))}
    </div>
  );
}

export default HomePage;
