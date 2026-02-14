import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchAllLessons } from '../services/lessonService';
import { fetchCategories } from '../services/categoryService';

const STATUS_COLORS = {
  published: 'bg-emerald-500',
  draft: 'bg-amber-400',
  archived: 'bg-slate-400',
};

const PIE_COLORS = ['#4f46e5', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#14b8a6', '#f97316'];

function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lessons, setLessons] = useState([]);
  const [categories, setCategories] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(null);

  const loadStats = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const [lessonData, categoryData] = await Promise.all([fetchAllLessons(), fetchCategories()]);
      setLessons(Array.isArray(lessonData) ? lessonData : []);
      setCategories(Array.isArray(categoryData) ? categoryData : []);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err.message ?? 'Failed to load dashboard stats.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const statusBreakdown = useMemo(() => {
    return lessons.reduce(
      (acc, lesson) => {
        const status = lesson.status ?? 'draft';
        if (!acc[status]) acc[status] = 0;
        acc[status] += 1;
        return acc;
      },
      { published: 0, draft: 0, archived: 0 },
    );
  }, [lessons]);

  const totalViews = useMemo(() => lessons.reduce((sum, lesson) => sum + (lesson.views_count ?? 0), 0), [lessons]);

  const mostPopular = useMemo(() => {
    if (lessons.length === 0) return null;
    return [...lessons].sort((a, b) => (b.views_count ?? 0) - (a.views_count ?? 0))[0];
  }, [lessons]);

  const categoryBuckets = useMemo(() => {
    const buckets = lessons.reduce((acc, lesson) => {
      const key = lesson.categories?.name ?? 'Uncategorized';
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {});

    return Object.entries(buckets)
      .map(([name, count], index) => ({
        name,
        count,
        percent: lessons.length > 0 ? Math.round((count / lessons.length) * 100) : 0,
        color: PIE_COLORS[index % PIE_COLORS.length],
      }))
      .sort((a, b) => b.count - a.count);
  }, [lessons]);

  const topLessons = useMemo(() => {
    return [...lessons]
      .sort((a, b) => (b.views_count ?? 0) - (a.views_count ?? 0))
      .slice(0, 10)
      .map((lesson, index, array) => ({
        ...lesson,
        width: array[0]?.views_count ? ((lesson.views_count ?? 0) / array[0].views_count) * 100 : 0,
      }));
  }, [lessons]);

  const viewsByDay = useMemo(() => {
    const points = [];
    const map = new Map();
    const today = new Date();

    for (let i = 29; i >= 0; i -= 1) {
      const date = new Date(today);
      date.setHours(0, 0, 0, 0);
      date.setDate(today.getDate() - i);
      const key = date.toISOString().slice(0, 10);
      map.set(key, 0);
      points.push({ date: key, views: 0 });
    }

    lessons.forEach((lesson) => {
      const dateKey = new Date(lesson.updated_at ?? lesson.created_at ?? Date.now()).toISOString().slice(0, 10);
      if (!map.has(dateKey)) return;
      map.set(dateKey, map.get(dateKey) + (lesson.views_count ?? 0));
    });

    return points.map((point) => ({
      ...point,
      label: new Date(point.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      views: map.get(point.date),
    }));
  }, [lessons]);

  const lineMax = useMemo(() => Math.max(...viewsByDay.map((point) => point.views), 1), [viewsByDay]);

  const recentPublished = useMemo(() => {
    return [...lessons]
      .filter((lesson) => lesson.status === 'published')
      .sort((a, b) => new Date(b.updated_at ?? b.created_at).getTime() - new Date(a.updated_at ?? a.created_at).getTime())
      .slice(0, 5);
  }, [lessons]);

  const isEmpty = !loading && lessons.length === 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard Overview</h1>
          <p className="text-sm text-slate-500">Last updated {lastUpdated ? formatRelativeTime(lastUpdated.toISOString()) : 'never'}</p>
        </div>
        <button
          type="button"
          onClick={loadStats}
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700"
        >
          <RefreshIcon /> Refresh
        </button>
      </div>

      {error && <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <div className="grid gap-4 md:grid-cols-2">
        <StatCard
          title="Total Lessons"
          value={lessons.length}
          icon={<BookIcon />}
          color="text-blue-600"
          bg="bg-blue-50"
          loading={loading}
          subtitle={`${statusBreakdown.published} published, ${statusBreakdown.draft} draft, ${statusBreakdown.archived} archived`}
        />
        <StatCard
          title="Total Views"
          value={totalViews.toLocaleString()}
          icon={<EyeIcon />}
          color="text-emerald-600"
          bg="bg-emerald-50"
          loading={loading}
          subtitle="Combined views across all lessons"
        />
        <StatCard
          title="Total Categories"
          value={categories.length}
          icon={<CategoryIcon />}
          color="text-violet-600"
          bg="bg-violet-50"
          loading={loading}
          subtitle="Categories currently in use"
        />
        <StatCard
          title="Most Popular Lesson"
          value={mostPopular ? (mostPopular.views_count ?? 0).toLocaleString() : 0}
          icon={<TrophyIcon />}
          color="text-amber-600"
          bg="bg-amber-50"
          loading={loading}
          subtitle={mostPopular ? mostPopular.title : 'No lesson data yet'}
        />
      </div>



      <section className="grid gap-4 lg:grid-cols-3">
        <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm lg:col-span-2">
          <h2 className="text-lg font-semibold">CMS Operations</h2>
          <p className="mb-3 text-sm text-slate-500">Use these shortcuts to manage content quickly.</p>
          <div className="grid gap-2 sm:grid-cols-3">
            <a href="/admin/lessons" className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-medium text-slate-700 transition hover:border-indigo-300 hover:bg-indigo-50">Manage Lessons</a>
            <a href="/admin/categories" className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-medium text-slate-700 transition hover:border-indigo-300 hover:bg-indigo-50">Manage Categories</a>
            <a href="/admin/media" className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-medium text-slate-700 transition hover:border-indigo-300 hover:bg-indigo-50">Manage Media</a>
          </div>
        </article>
        <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-lg font-semibold">Content Health</h2>
          <p className="text-sm text-slate-600">Draft ratio: {lessons.length ? Math.round((statusBreakdown.draft / lessons.length) * 100) : 0}%</p>
          <p className="text-sm text-slate-600">Published ratio: {lessons.length ? Math.round((statusBreakdown.published / lessons.length) * 100) : 0}%</p>
          <p className="mt-2 text-xs text-slate-500">Tip: keep your draft ratio low by scheduling weekly publishing sprints.</p>
        </article>
      </section>

      {isEmpty ? (
        <section className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center shadow-sm">
          <h2 className="text-lg font-semibold">No lesson data yet</h2>
          <p className="mt-2 text-sm text-slate-500">Create and publish lessons to unlock analytics visualizations.</p>
        </section>
      ) : (
        <>
          <div className="grid gap-4 xl:grid-cols-2">
            <ChartCard title="Views Over Time (Last 30 Days)" subtitle="Lesson views grouped by lesson update day.">
              <SimpleLineChart data={viewsByDay} max={lineMax} loading={loading} />
            </ChartCard>

            <ChartCard title="Most Viewed Lessons" subtitle="Top 10 lessons ranked by view count.">
              <HorizontalBars data={topLessons} loading={loading} />
            </ChartCard>

            <ChartCard title="Lessons by Category" subtitle="Distribution of lessons by category.">
              <PieLikeChart data={categoryBuckets} loading={loading} />
            </ChartCard>

            <ChartCard title="Lessons by Status" subtitle="Published, draft, and archived totals.">
              <StatusBars breakdown={statusBreakdown} total={lessons.length} loading={loading} />
            </ChartCard>
          </div>

          <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="text-lg font-semibold">Recent Activity</h2>
            <p className="mb-3 text-sm text-slate-500">Last 5 published lessons</p>

            <div className="space-y-2">
              {loading ? (
                <>
                  <div className="h-14 animate-pulse rounded bg-slate-100" />
                  <div className="h-14 animate-pulse rounded bg-slate-100" />
                </>
              ) : recentPublished.length === 0 ? (
                <p className="rounded-lg border border-dashed border-slate-300 p-4 text-sm text-slate-500">No published lessons yet.</p>
              ) : (
                recentPublished.map((lesson) => (
                  <Link
                    key={lesson.id}
                    to="/admin/lessons"
                    className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 transition hover:border-indigo-300 hover:bg-indigo-50"
                    title="Open lesson manager to edit"
                  >
                    <div>
                      <p className="font-medium text-slate-800">{lesson.title}</p>
                      <p className="text-xs text-slate-500">{formatRelativeTime(lesson.updated_at ?? lesson.created_at)}</p>
                    </div>
                    <span className="text-sm font-semibold text-indigo-700">{lesson.views_count ?? 0} views</span>
                  </Link>
                ))
              )}
            </div>
          </section>
        </>
      )}
    </div>
  );
}

function StatCard({ title, value, subtitle, icon, color, bg, loading }) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-slate-500">{title}</p>
          {loading ? (
            <div className="mt-3 h-10 w-20 animate-pulse rounded bg-slate-100" />
          ) : (
            <p className={`mt-2 text-4xl font-bold ${color}`}>{value}</p>
          )}
        </div>
        <div className={`rounded-lg p-2 ${bg} ${color}`}>{icon}</div>
      </div>
      <p className="mt-3 text-xs text-slate-500">{subtitle}</p>
    </article>
  );
}

function ChartCard({ title, subtitle, children }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="mb-3 text-sm text-slate-500">{subtitle}</p>
      {children}
    </section>
  );
}

function SimpleLineChart({ data, max, loading }) {
  if (loading) return <div className="h-64 animate-pulse rounded bg-slate-100" />;
  const points = data.map((point, index) => `${(index / (data.length - 1 || 1)) * 100},${100 - (point.views / max) * 100}`).join(' ');

  return (
    <div className="space-y-2">
      <svg viewBox="0 0 100 100" className="h-64 w-full rounded-lg bg-slate-50 p-3">
        <defs>
          <linearGradient id="lineFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6366f1" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#6366f1" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        <polyline fill="none" stroke="#6366f1" strokeWidth="2" points={points} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <div className="grid grid-cols-3 gap-2 text-xs text-slate-500 sm:grid-cols-6">
        {data.filter((_, index) => index % 5 === 0).map((point) => (
          <span key={point.date}>{point.label}</span>
        ))}
      </div>
    </div>
  );
}

function HorizontalBars({ data, loading }) {
  if (loading) return <div className="h-64 animate-pulse rounded bg-slate-100" />;
  if (data.length === 0) return <p className="text-sm text-slate-500">No lesson view data yet.</p>;

  return (
    <div className="space-y-2">
      {data.map((lesson) => (
        <div key={lesson.id} className="space-y-1" title={`${lesson.views_count ?? 0} views`}>
          <div className="flex justify-between text-xs text-slate-600">
            <span>{truncate(lesson.title, 45)}</span>
            <span className="font-semibold">{lesson.views_count ?? 0}</span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-gradient-to-r from-indigo-400 to-blue-600 transition-all duration-700"
              style={{ width: `${Math.max(lesson.width, 5)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function PieLikeChart({ data, loading }) {
  if (loading) return <div className="h-64 animate-pulse rounded bg-slate-100" />;
  if (data.length === 0) return <p className="text-sm text-slate-500">No category data yet.</p>;

  return (
    <div className="space-y-3">
      {data.map((item) => (
        <div key={item.name} className="flex items-center gap-3">
          <span className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
          <div className="h-3 flex-1 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full transition-all duration-700" style={{ width: `${item.percent}%`, backgroundColor: item.color }} />
          </div>
          <span className="w-24 text-right text-xs text-slate-600">
            {item.name} ({item.count}, {item.percent}%)
          </span>
        </div>
      ))}
    </div>
  );
}

function StatusBars({ breakdown, total, loading }) {
  if (loading) return <div className="h-64 animate-pulse rounded bg-slate-100" />;

  return (
    <div className="space-y-3">
      {['published', 'draft', 'archived'].map((status) => {
        const count = breakdown[status] ?? 0;
        const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
        return (
          <div key={status}>
            <div className="mb-1 flex items-center justify-between text-sm">
              <span className="capitalize text-slate-700">{status}</span>
              <span className="font-semibold text-slate-700">
                {count} ({percentage}%)
              </span>
            </div>
            <div className="h-4 overflow-hidden rounded-full bg-slate-100">
              <div className={`h-full ${STATUS_COLORS[status]} transition-all duration-700`} style={{ width: `${Math.max(percentage, count > 0 ? 6 : 0)}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function formatRelativeTime(value) {
  const date = new Date(value);
  const diffMs = Date.now() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  return date.toLocaleDateString();
}

function truncate(text, maxLength) {
  if (!text) return 'Untitled lesson';
  return text.length > maxLength ? `${text.slice(0, maxLength - 1)}…` : text;
}

function IconBase({ children }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
      {children}
    </svg>
  );
}

function BookIcon() {
  return (
    <IconBase>
      <path d="M4 5a2 2 0 0 1 2-2h12v16H6a2 2 0 0 0-2 2z" />
      <path d="M6 17a2 2 0 0 0-2 2" />
    </IconBase>
  );
}

function EyeIcon() {
  return (
    <IconBase>
      <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6z" />
      <circle cx="12" cy="12" r="3" />
    </IconBase>
  );
}

function CategoryIcon() {
  return (
    <IconBase>
      <path d="M3 3h8v8H3z" />
      <path d="M13 3h8v5h-8z" />
      <path d="M13 10h8v11h-8z" />
      <path d="M3 13h8v8H3z" />
    </IconBase>
  );
}

function TrophyIcon() {
  return (
    <IconBase>
      <path d="M7 4h10v3a5 5 0 0 1-5 5 5 5 0 0 1-5-5z" />
      <path d="M7 5H5a2 2 0 0 0 0 4h2" />
      <path d="M17 5h2a2 2 0 0 1 0 4h-2" />
      <path d="M12 12v4" />
      <path d="M8 20h8" />
    </IconBase>
  );
}

function RefreshIcon() {
  return (
    <IconBase>
      <path d="M21 12a9 9 0 1 1-2.64-6.36" />
      <path d="M21 3v6h-6" />
    </IconBase>
  );
}

export default DashboardPage;
