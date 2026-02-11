import { useEffect, useState } from 'react';
import { fetchAllLessons } from '../services/lessonService';
import { fetchCategories } from '../services/categoryService';
import { fetchMedia } from '../services/mediaService';

function DashboardPage() {
  const [stats, setStats] = useState({ lessons: 0, categories: 0, media: 0 });

  useEffect(() => {
    async function loadStats() {
      const [lessons, categories, media] = await Promise.all([
        fetchAllLessons(),
        fetchCategories(),
        fetchMedia(),
      ]);
      setStats({ lessons: lessons.length, categories: categories.length, media: media.length });
    }

    loadStats();
  }, []);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold">Dashboard</h1>
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Lessons" value={stats.lessons} />
        <StatCard label="Categories" value={stats.categories} />
        <StatCard label="Media Files" value={stats.media} />
      </div>
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-bold text-indigo-600">{value}</p>
    </article>
  );
}

export default DashboardPage;
