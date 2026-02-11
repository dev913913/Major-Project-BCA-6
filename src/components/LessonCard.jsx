import { Link } from 'react-router-dom';

function LessonCard({ lesson }) {
  return (
    <article className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      {lesson.featured_image && (
        <img src={lesson.featured_image} alt={lesson.title} className="h-40 w-full object-cover" />
      )}
      <div className="space-y-2 p-4">
        <p className="text-xs font-medium uppercase text-indigo-600">
          {lesson.categories?.name} • {lesson.categories?.difficulty}
        </p>
        <h2 className="text-lg font-semibold">{lesson.title}</h2>
        <p className="text-sm text-slate-500">Views: {lesson.views_count}</p>
        <Link to={`/lesson/${lesson.id}`} className="inline-block text-sm font-medium text-indigo-600">
          Read lesson →
        </Link>
      </div>
    </article>
  );
}

export default LessonCard;
