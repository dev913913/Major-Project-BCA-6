import { Link } from 'react-router-dom';

function estimateReadingTime(content) {
  const words = (content ?? '').trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

function excerpt(content) {
  if (!content) return 'Start this lesson to explore practical programming concepts and examples.';
  const stripped = content.replace(/[#>*`\-\n]/g, ' ').replace(/\s+/g, ' ').trim();
  return stripped.length > 100 ? `${stripped.slice(0, 100)}…` : stripped;
}

function LessonCard({ lesson, featured = false }) {
  const readingTime = estimateReadingTime(lesson.content);

  return (
    <Link
      to={`/lesson/${lesson.id}`}
      className="group block overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl"
    >
      <div className="relative h-48 overflow-hidden">
        {lesson.featured_image ? (
          <img
            src={lesson.featured_image}
            alt={lesson.title}
            loading="lazy"
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-indigo-500 via-violet-500 to-cyan-500" aria-hidden="true" />
        )}
        <span className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-indigo-700 backdrop-blur">
          {lesson.categories?.name ?? 'General'}
        </span>
      </div>

      <div className="space-y-3 p-5">
        <h3 className="line-clamp-2 text-lg font-bold text-slate-900">{lesson.title}</h3>
        <p className="line-clamp-2 text-sm text-slate-600">{excerpt(lesson.content)}</p>

        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
          <StatPill label={`${lesson.views_count ?? 0} views`} icon="👁" />
          <StatPill label={`${readingTime} min read`} icon="🕒" />
          <StatPill label={new Date(lesson.created_at).toLocaleDateString()} icon="📅" />
        </div>

        <div className="pt-1 text-sm font-semibold text-indigo-600">{featured ? 'Read More →' : 'Open Lesson →'}</div>
      </div>
    </Link>
  );
}

function StatPill({ label, icon }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1">
      <span aria-hidden="true">{icon}</span>
      {label}
    </span>
  );
}

export default LessonCard;
