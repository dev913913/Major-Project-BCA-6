import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  createLesson,
  deleteLesson,
  fetchAllLessons,
  updateLesson,
} from '../services/lessonService';
import { fetchCategories } from '../services/categoryService';
import MarkdownRenderer from '../components/MarkdownRenderer';
import { friendlyErrorMessage, reportError } from '../utils/errorUtils';

const initialForm = {
  title: '',
  content: '## New Lesson\n\nWrite your lesson in Markdown.',
  code_snippets: '',
  featured_image: '',
  category_id: '',
  status: 'draft',
};

const PAGE_SIZE = 8;

function mapCodeSnippetsToTextarea(value) {
  if (!Array.isArray(value) || value.length === 0) return '';

  return value
    .map((snippet) => {
      if (typeof snippet === 'string') return snippet;
      if (snippet && typeof snippet === 'object') return snippet.code ?? snippet.content ?? '';
      return '';
    })
    .filter(Boolean)
    .join('\n\n---\n\n');
}

function mapTextareaToCodeSnippets(value) {
  if (!value.trim()) return [];

  return value
    .split(/\n\s*---\s*\n/g)
    .map((snippet) => snippet.trim())
    .filter(Boolean);
}

function badgeClass(status) {
  if (status === 'published') return 'bg-emerald-100 text-emerald-700';
  if (status === 'archived') return 'bg-slate-200 text-slate-700';
  return 'bg-amber-100 text-amber-700';
}

function LessonsManagerPage() {
  const [lessons, setLessons] = useState([]);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const safeLessons = lessons ?? [];
  const safeCategories = categories ?? [];

  const isEditing = useMemo(() => Boolean(editingId), [editingId]);

  async function loadData() {
    try {
      setLoading(true);
      setError('');
      const [lessonList, categoryList] = await Promise.all([fetchAllLessons(), fetchCategories()]);
      setLessons(lessonList);
      setCategories(categoryList);
    } catch (err) {
      reportError('Admin lessons load', err);
      setError(friendlyErrorMessage('Unable to load lessons right now. Please try again.'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const filteredLessons = useMemo(() => {
    return (safeLessons ?? []).filter((lesson) => {
      const title = typeof lesson.title === 'string' ? lesson.title : '';
      const matchesQuery = title.toLowerCase().includes(query.toLowerCase());
      const matchesStatus = statusFilter === 'all' ? true : lesson.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [safeLessons, query, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredLessons.length / PAGE_SIZE));

  const pagedLessons = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredLessons.slice(start, start + PAGE_SIZE);
  }, [filteredLessons, page]);

  useEffect(() => {
    setPage(1);
  }, [query, statusFilter]);

  async function handleSubmit(event) {
    event.preventDefault();

    const payload = {
      ...form,
      category_id: form.category_id || null,
      code_snippets: mapTextareaToCodeSnippets(form.code_snippets),
    };

    try {
      setError('');
      if (isEditing) {
        await updateLesson(editingId, payload);
      } else {
        await createLesson(payload);
      }

      setForm(initialForm);
      setEditingId(null);
      await loadData();
    } catch (err) {
      reportError('Admin lesson save', err);
      setError(friendlyErrorMessage('Unable to save lesson right now. Please try again.'));
    }
  }

  function handleEdit(lesson) {
    setEditingId(lesson.id);
    setForm({
      title: lesson.title ?? '',
      content: lesson.content ?? '',
      code_snippets: mapCodeSnippetsToTextarea(lesson.code_snippets),
      featured_image: lesson.featured_image ?? '',
      category_id: lesson.category_id ?? '',
      status: lesson.status ?? 'draft',
    });
  }

  async function handleDelete(id) {
    try {
      setError('');
      await deleteLesson(id);
      if (editingId === id) {
        setEditingId(null);
        setForm(initialForm);
      }
      await loadData();
    } catch (err) {
      reportError('Admin lesson delete', err);
      setError(friendlyErrorMessage('Unable to delete lesson right now. Please try again.'));
    }
  }

  async function handleStatusChange(lesson, nextStatus) {
    if (lesson.status === nextStatus) return;

    try {
      setError('');
      await updateLesson(lesson.id, { status: nextStatus });
      await loadData();
    } catch (err) {
      reportError('Admin lesson status update', err);
      setError(friendlyErrorMessage('Unable to update lesson status right now. Please try again.'));
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Lessons</h1>

      {error && <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
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
              {(safeCategories ?? []).map((category) => (
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
          <span className="mb-1 block text-sm font-medium">Code Snippets (split snippets with --- line)</span>
          <textarea
            rows={6}
            value={form.code_snippets}
            onChange={(e) => setForm({ ...form, code_snippets: e.target.value })}
            className="w-full rounded border border-slate-300 px-3 py-2 font-mono"
            placeholder="console.log('Hello World');"
          />
        </label>

        <div className="flex flex-wrap gap-2">
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
          {isEditing && (
            <Link
              to={`/lesson/${editingId}`}
              target="_blank"
              rel="noreferrer"
              className="rounded bg-slate-900 px-4 py-2 font-medium text-white"
            >
              Open Preview Page
            </Link>
          )}
        </div>
      </form>

      <section className="space-y-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold">Live Preview</h2>
          <p className="text-sm text-slate-500">
            {isEditing ? 'Previewing current lesson edits.' : 'Previewing lesson draft before publishing.'}
          </p>
        </div>

        <article className="space-y-4 rounded-lg border border-slate-100 bg-slate-50 p-4">
          <h3 className="text-2xl font-bold text-slate-900">{form.title || 'Untitled Lesson'}</h3>
          <MarkdownRenderer content={form.content || 'Start writing to see a preview...'} />

          {mapTextareaToCodeSnippets(form.code_snippets).length > 0 && (
            <div className="space-y-3">
              <h4 className="text-lg font-semibold text-slate-800">Code Snippets Preview</h4>
              {mapTextareaToCodeSnippets(form.code_snippets).map((snippet, index) => (
                <MarkdownRenderer key={`preview-snippet-${index + 1}`} content={`\`\`\`javascript\n${snippet}\n\`\`\``} />
              ))}
            </div>
          )}
        </article>
      </section>

      <div className="space-y-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full rounded border border-slate-300 px-3 py-2 sm:max-w-xs"
            placeholder="Search lessons..."
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded border border-slate-300 px-3 py-2"
          >
            <option value="all">All statuses</option>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-2 text-left">Title</th>
                <th className="px-4 py-2 text-left">Status</th>
                <th className="px-4 py-2 text-left">Views</th>
                <th className="px-4 py-2 text-left">Category</th>
                <th className="px-4 py-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td className="px-4 py-4 text-slate-500" colSpan={5}>
                    Loading lessons...
                  </td>
                </tr>
              ) : (
                pagedLessons.map((lesson) => (
                  <tr key={lesson.id}>
                    <td className="px-4 py-2 font-medium">{lesson.title}</td>
                    <td className="px-4 py-2">
                      <span className={`rounded-full px-2 py-1 text-xs font-semibold ${badgeClass(lesson.status)}`}>
                        {lesson.status}
                      </span>
                    </td>
                    <td className="px-4 py-2 font-semibold text-indigo-700">{lesson.views_count ?? 0}</td>
                    <td className="px-4 py-2">{lesson.categories?.name ?? 'N/A'}</td>
                    <td className="px-4 py-2">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          className="rounded bg-amber-100 px-3 py-1 text-amber-800"
                          onClick={() => handleEdit(lesson)}
                        >
                          Edit
                        </button>
                        <Link
                          to={`/lesson/${lesson.id}`}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded bg-slate-100 px-3 py-1 text-slate-700"
                        >
                          {lesson.status === 'published' ? 'View' : 'Preview'}
                        </Link>
                        {lesson.status !== 'published' && (
                          <button
                            type="button"
                            className="rounded bg-emerald-100 px-3 py-1 text-emerald-800"
                            onClick={() => handleStatusChange(lesson, 'published')}
                          >
                            Publish
                          </button>
                        )}
                        {lesson.status !== 'archived' && (
                          <button
                            type="button"
                            className="rounded bg-slate-200 px-3 py-1 text-slate-700"
                            onClick={() => handleStatusChange(lesson, 'archived')}
                          >
                            Archive
                          </button>
                        )}
                        {lesson.status !== 'draft' && (
                          <button
                            type="button"
                            className="rounded bg-indigo-100 px-3 py-1 text-indigo-700"
                            onClick={() => handleStatusChange(lesson, 'draft')}
                          >
                            Move to Draft
                          </button>
                        )}
                        <button
                          type="button"
                          className="rounded bg-red-100 px-3 py-1 text-red-700"
                          onClick={() => handleDelete(lesson.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500">
            Showing {pagedLessons.length} of {filteredLessons.length} lessons
          </p>
          <div className="space-x-2">
            <button
              type="button"
              className="rounded border border-slate-300 px-3 py-1 disabled:opacity-50"
              disabled={page <= 1}
              onClick={() => setPage((prev) => prev - 1)}
            >
              Prev
            </button>
            <span className="text-sm text-slate-600">
              Page {page} / {totalPages}
            </span>
            <button
              type="button"
              className="rounded border border-slate-300 px-3 py-1 disabled:opacity-50"
              disabled={page >= totalPages}
              onClick={() => setPage((prev) => prev + 1)}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LessonsManagerPage;
