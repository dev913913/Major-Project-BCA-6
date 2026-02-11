import { useEffect, useState } from 'react';
import LessonCard from '../components/LessonCard';
import { fetchPublishedLessons } from '../services/lessonService';

function HomePage() {
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPublishedLessons()
      .then(setLessons)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-slate-600">Loading lessons...</p>;
  if (error) return <p className="text-red-600">{error}</p>;

  return (
    <section>
      <h1 className="mb-6 text-3xl font-bold">Programming Lessons</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {lessons.map((lesson) => (
          <LessonCard key={lesson.id} lesson={lesson} />
        ))}
      </div>
      {!lessons.length && <p>No published lessons yet.</p>}
    </section>
  );
}

export default HomePage;
