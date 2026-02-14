import { useEffect, useState } from 'react';
import {
  createCategory,
  deleteCategory,
  fetchCategories,
  updateCategory,
} from '../services/categoryService';

const initialForm = { name: '', difficulty: 'beginner' };

function CategoriesManagerPage() {
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function loadCategories() {
    try {
      setLoading(true);
      setError('');
      const data = await fetchCategories();
      setCategories(data);
    } catch (err) {
      setError(err.message ?? 'Failed to load categories.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCategories();
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();

    try {
      if (editingId) {
        await updateCategory(editingId, form);
      } else {
        await createCategory(form);
      }

      setEditingId(null);
      setForm(initialForm);
      await loadCategories();
    } catch (err) {
      setError(err.message ?? 'Failed to save category.');
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Categories</h1>
      {error && <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <form onSubmit={handleSubmit} className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-3">
        <input
          type="text"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="Category Name"
          className="rounded border border-slate-300 px-3 py-2"
          required
        />
        <select
          value={form.difficulty}
          onChange={(e) => setForm({ ...form, difficulty: e.target.value })}
          className="rounded border border-slate-300 px-3 py-2"
        >
          <option value="beginner">Beginner</option>
          <option value="intermediate">Intermediate</option>
          <option value="advanced">Advanced</option>
        </select>
        <button type="submit" className="rounded bg-indigo-600 px-4 py-2 font-medium text-white">
          {editingId ? 'Update' : 'Add'}
        </button>
      </form>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-2 text-left">Category</th>
              <th className="px-4 py-2 text-left">Difficulty</th>
              <th className="px-4 py-2 text-left">Lessons</th>
              <th className="px-4 py-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={4} className="px-4 py-3 text-slate-500">
                  Loading categories...
                </td>
              </tr>
            ) : (
              categories.map((category) => (
                <tr key={category.id}>
                  <td className="px-4 py-2 font-medium">{category.name}</td>
                  <td className="px-4 py-2 capitalize">{category.difficulty}</td>
                  <td className="px-4 py-2">
                    <span className="rounded-full bg-indigo-100 px-2 py-1 text-xs font-semibold text-indigo-700">
                      {category.lesson_count}
                    </span>
                  </td>
                  <td className="space-x-2 px-4 py-2">
                    <button
                      type="button"
                      className="rounded bg-amber-100 px-3 py-1 text-amber-800"
                      onClick={() => {
                        setEditingId(category.id);
                        setForm({ name: category.name, difficulty: category.difficulty });
                      }}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="rounded bg-red-100 px-3 py-1 text-red-700"
                      onClick={async () => {
                        try {
                          await deleteCategory(category.id);
                          await loadCategories();
                        } catch (err) {
                          setError(err.message ?? 'Failed to delete category.');
                        }
                      }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default CategoriesManagerPage;
