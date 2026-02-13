import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import MarkdownRenderer from '../components/MarkdownRenderer';
import { fetchLessonById, incrementLessonViews } from '../services/lessonService';

function LessonPage() {
  const { id } = useParams();
  const [lesson, setLesson] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadLesson() {
      try {
        const data = await fetchLessonById(id);
        setLesson(data);
        await incrementLessonViews(data.id);
      } catch (err) {
        setError(err.message);
      }
    }

    loadLesson();
  }, [id]);

  if (error) return <p className="text-red-600">{error}</p>;
  if (!lesson) return <p className="text-slate-600">Loading lesson...</p>;

  return (
    <article className="space-y-5">
      <h1 className="text-3xl font-bold">{lesson.title}</h1>
      <div className="flex flex-wrap gap-2 text-xs font-medium text-indigo-700">
        <span className="rounded bg-indigo-50 px-2 py-1">{lesson.categories?.name}</span>
        {(lesson.lesson_tags ?? []).map((entry) => (
          <span key={entry.tags.name} className="rounded bg-slate-100 px-2 py-1 text-slate-700">
            {entry.tags.name}
          </span>
        ))}
      </div>
      <MarkdownRenderer content={lesson.content} />
    </article>
  );
}

export default LessonPage;
