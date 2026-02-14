import { useEffect, useMemo, useState } from 'react';
import { fetchAllLessons } from '../services/lessonService';
import { fetchCategories } from '../services/categoryService';

function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lessons, setLessons] = useState([]);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    async function loadStats() {
      try {
        setLoading(true);
        setError('');
        const [lessonData, categoryData] = await Promise.all([fetchAllLessons(), fetchCategories()]);
        setLessons(lessonData);
        setCategories(categoryData);
      } catch (err) {
        setError(err.message ?? 'Failed to load dashboard stats.');
      } finally {
        setLoading(false);
      }
    }

    loadStats();
  }, []);

  const totalViews = useMemo(
    () => lessons.reduce((sum, lesson) => sum + (lesson.views_count ?? 0), 0),
    [lessons],
  );

  const recentPublished = useMemo(
    () => lessons.filter((lesson) => lesson.status === 'published').slice(0, 5),
    [lessons],
  );

  const recentViewed = useMemo(
    () => [...lessons].sort((a, b) => (b.views_count ?? 0) - (a.views_count ?? 0)).slice(0, 5),
    [lessons],
  );

  const recentActivityCount = recentPublished.length + recentViewed.length;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Dashboard Overview</h1>

      {error && <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Lessons" value={lessons.length} loading={loading} />
        <StatCard label="Total Views" value={totalViews} loading={loading} />
        <StatCard label="Total Categories" value={categories.length} loading={loading} />
        <StatCard label="Recent Activity" value={recentActivityCount} loading={loading} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ActivityPanel title="Recently Published Lessons" loading={loading}>
          {recentPublished.map((lesson) => (
            <ActivityItem
              key={lesson.id}
              title={lesson.title}
              subtitle={`Updated ${new Date(lesson.updated_at).toLocaleDateString()}`}
              rightLabel="Published"
            />
          ))}
        </ActivityPanel>

        <ActivityPanel title="Most Viewed Lessons" loading={loading}>
          {recentViewed.map((lesson) => (
            <ActivityItem
              key={lesson.id}
              title={lesson.title}
              subtitle={`Status: ${lesson.status}`}
              rightLabel={`${lesson.views_count ?? 0} views`}
            />
          ))}
        </ActivityPanel>
      </div>
    </div>
  );
}

function StatCard({ label, value, loading }) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm text-slate-500">{label}</p>
      {loading ? <div className="mt-3 h-8 w-20 animate-pulse rounded bg-slate-100" /> : <p className="mt-2 text-3xl font-bold text-indigo-600">{value}</p>}
    </article>
  );
}

function ActivityPanel({ title, children, loading }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="mb-3 text-lg font-semibold">{title}</h2>
      <div className="max-h-80 space-y-2 overflow-y-auto">
        {loading ? (
          <>
            <div className="h-14 animate-pulse rounded bg-slate-100" />
            <div className="h-14 animate-pulse rounded bg-slate-100" />
          </>
        ) : (
          children
        )}
      </div>
    </section>
  );
}

function ActivityItem({ title, subtitle, rightLabel }) {
  return (
    <article className="flex items-center justify-between rounded border border-slate-100 bg-slate-50 px-3 py-2">
      <div>
        <p className="font-medium">{title}</p>
        <p className="text-xs text-slate-500">{subtitle}</p>
      </div>
      <span className="rounded-full bg-indigo-100 px-2 py-1 text-xs font-medium text-indigo-700">{rightLabel}</span>
    </article>
  );
}

export default DashboardPage;
