import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSeo } from '../components/Seo';
import { fetchCategories } from '../services/categoryService';

function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useSeo({
    title: 'Categories | ProgLearn by Dev Kumar',
    description: 'Browse programming topics by category on ProgLearn by Dev Kumar.',
    type: 'website',
    url: typeof window !== 'undefined' ? window.location.href : undefined,
  });

  useEffect(() => {
    fetchCategories().then(setCategories).finally(() => setLoading(false));
  }, []);

  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-4xl font-black">Categories</h1>
        <p className="mt-2 text-slate-600">Explore learning paths organized by topic.</p>
      </header>

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
