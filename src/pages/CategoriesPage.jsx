import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSeo } from '../components/Seo';
import { fetchCategories } from '../services/categoryService';
import { friendlyErrorMessage, reportError } from '../utils/errorUtils';

function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useSeo({
    title: 'Categories | Codev by Dev Kumar',
    description: 'Browse programming topics by category on Codev by Dev Kumar.',
    type: 'website',
    url: typeof window !== 'undefined' ? window.location.href : undefined,
  });

  useEffect(() => {
    fetchCategories()
      .then(setCategories)
      .catch((err) => {
        reportError('CategoriesPage load', err);
        setError(friendlyErrorMessage('Unable to load categories right now. Please try again.'));
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-4xl font-black">Categories</h1>
        <p className="mt-2 text-slate-600">Explore learning paths organized by topic.</p>
      </header>

      {error && <p className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">{error}</p>}

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="h-28 animate-pulse rounded-xl bg-slate-100" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => (
            <article key={category.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-xl font-bold">{category.name}</h2>
              <p className="mt-2 text-sm text-slate-600">Difficulty: {category.difficulty}</p>
              <p className="text-sm text-slate-600">Lessons: {category.lesson_count}</p>
              <Link to="/lessons" className="mt-3 inline-block text-sm font-semibold text-indigo-600">
                Browse lessons →
              </Link>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export default CategoriesPage;
