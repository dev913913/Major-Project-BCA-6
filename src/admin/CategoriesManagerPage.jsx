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

  async function loadCategories() {
    const data = await fetchCategories();
    setCategories(data);
  }

  useEffect(() => {
    loadCategories();
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();

    if (editingId) {
      await updateCategory(editingId, form);
    } else {
      await createCategory(form);
    }

    setEditingId(null);
    setForm(initialForm);
    await loadCategories();
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Categories</h1>
      <form onSubmit={handleSubmit} className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 sm:grid-cols-3">
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

      <ul className="divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white">
        {categories.map((category) => (
          <li key={category.id} className="flex items-center justify-between px-4 py-3">
            <div>
              <p className="font-medium">{category.name}</p>
              <p className="text-xs text-slate-500">{category.difficulty}</p>
            </div>
            <div className="space-x-2 text-sm">
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
                  await deleteCategory(category.id);
                  await loadCategories();
                }}
              >
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default CategoriesManagerPage;
