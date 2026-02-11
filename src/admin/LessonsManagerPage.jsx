import { useEffect, useMemo, useState } from 'react';
import {
  createLesson,
  deleteLesson,
  fetchAllLessons,
  updateLesson,
} from '../services/lessonService';
import { fetchCategories } from '../services/categoryService';

const initialForm = {
  title: '',
  content: '## New Lesson\n\nWrite your lesson in Markdown.',
  code_snippets: '',
  featured_image: '',
  category_id: '',
  status: 'draft',
};

function LessonsManagerPage() {
  const [lessons, setLessons] = useState([]);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);

  const isEditing = useMemo(() => Boolean(editingId), [editingId]);

  async function loadData() {
    const [lessonList, categoryList] = await Promise.all([fetchAllLessons(), fetchCategories()]);
    setLessons(lessonList);
    setCategories(categoryList);
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();

    const payload = {
      ...form,
      category_id: form.category_id || null,
      code_snippets: form.code_snippets ? [form.code_snippets] : [],
    };

    if (isEditing) {
      await updateLesson(editingId, payload);
    } else {
      await createLesson(payload);
    }

    setForm(initialForm);
    setEditingId(null);
    await loadData();
  }

  function handleEdit(lesson) {
    setEditingId(lesson.id);
    setForm((prev) => ({
      ...prev,
      title: lesson.title,
      status: lesson.status,
    }));
  }

  async function handleDelete(id) {
    await deleteLesson(id);
    if (editingId === id) {
      setEditingId(null);
      setForm(initialForm);
    }
    await loadData();
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Lessons</h1>

      <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-slate-200 bg-white p-4">
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Title</span>
          <input
            type="text"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="w-full rounded border border-slate-300 px-3 py-2"
            required
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium">Content (Markdown)</span>
          <textarea
            rows={10}
            value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
            className="w-full rounded border border-slate-300 px-3 py-2 font-mono"
            required
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-sm font-medium">Category</span>
            <select
              value={form.category_id}
              onChange={(e) => setForm({ ...form, category_id: e.target.value })}
              className="w-full rounded border border-slate-300 px-3 py-2"
            >
              <option value="">No category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name} ({category.difficulty})
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium">Status</span>
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              className="w-full rounded border border-slate-300 px-3 py-2"
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
          </label>
        </div>

        <label className="block">
          <span className="mb-1 block text-sm font-medium">Featured Image URL</span>
          <input
            type="url"
            value={form.featured_image}
            onChange={(e) => setForm({ ...form, featured_image: e.target.value })}
            className="w-full rounded border border-slate-300 px-3 py-2"
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium">Code Snippet</span>
          <textarea
            rows={6}
            value={form.code_snippets}
            onChange={(e) => setForm({ ...form, code_snippets: e.target.value })}
            className="w-full rounded border border-slate-300 px-3 py-2 font-mono"
            placeholder="console.log('Hello World');"
          />
        </label>

        <div className="flex gap-2">
          <button type="submit" className="rounded bg-indigo-600 px-4 py-2 font-medium text-white">
            {isEditing ? 'Update Lesson' : 'Create Lesson'}
          </button>
          {isEditing && (
            <button
              type="button"
              onClick={() => {
                setEditingId(null);
                setForm(initialForm);
              }}
              className="rounded bg-slate-200 px-4 py-2 font-medium text-slate-700"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-2 text-left">Title</th>
              <th className="px-4 py-2 text-left">Status</th>
              <th className="px-4 py-2 text-left">Category</th>
              <th className="px-4 py-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {lessons.map((lesson) => (
              <tr key={lesson.id}>
                <td className="px-4 py-2">{lesson.title}</td>
                <td className="px-4 py-2">{lesson.status}</td>
                <td className="px-4 py-2">{lesson.categories?.name ?? 'N/A'}</td>
                <td className="px-4 py-2 space-x-2">
                  <button
                    type="button"
                    className="rounded bg-amber-100 px-3 py-1 text-amber-800"
                    onClick={() => handleEdit(lesson)}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="rounded bg-red-100 px-3 py-1 text-red-700"
                    onClick={() => handleDelete(lesson.id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default LessonsManagerPage;
