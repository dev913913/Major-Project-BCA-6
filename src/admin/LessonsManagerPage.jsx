import { useEffect, useMemo, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import MarkdownRenderer from '../components/MarkdownRenderer';
import {
  fetchAllLessons,
  fetchAllCategories,
  createLesson,
  updateLesson,
  deleteLesson,
  updateLessonStatus,
} from '../services/lessonService';

const ITEMS_PER_PAGE = 10;
const MIN_TITLE_LENGTH = 3;
const MIN_CONTENT_LENGTH = 10;

function mapTextareaToCodeSnippets(snippetsText) {
  if (!snippetsText || typeof snippetsText !== 'string') return [];
  return snippetsText
    .split('---')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

// Custom hook for responsive media query
function useMediaQuery(query) {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia(query);
    setMatches(mediaQuery.matches);

    const handler = (e) => setMatches(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, [query]);

  return matches;
}

// Extract PreviewContent as a separate memoized component to prevent recreation
function PreviewContent({ title, content, codeSnippets }) {
  const snippets = useMemo(() => mapTextareaToCodeSnippets(codeSnippets), [codeSnippets]);
  
  return (
    <article className="space-y-4 rounded-lg border border-slate-100 bg-slate-50 p-4">
      <h3 className="text-2xl font-bold text-slate-900">{title || 'Untitled Lesson'}</h3>
      <MarkdownRenderer content={content || 'Start writing to see a preview...'} />

      {snippets.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-lg font-semibold text-slate-800">Code Snippets Preview</h4>
          {snippets.map((snippet, index) => (
            <MarkdownRenderer
              key={`preview-snippet-${index + 1}`}
              content={`\`\`\`javascript\n${snippet}\n\`\`\``}
            />
          ))}
        </div>
      )}
    </article>
  );
}

function LessonsManagerPage() {
  const formRef = useRef(null);
  const [lessons, setLessons] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [editingId, setEditingId] = useState(null);
  const [activeTab, setActiveTab] = useState('form');
  const [showForm, setShowForm] = useState(true);
  const [showPreview, setShowPreview] = useState(true);
  const [showList, setShowList] = useState(true);
  const isDesktop = useMediaQuery('(min-width: 768px)');

  const initialForm = {
    title: '',
    content: '',
    category_id: '',
    status: 'draft',
    featured_image: '',
    code_snippets: '',
  };

  const [form, setForm] = useState(initialForm);
  const isEditing = !!editingId;
  const isFormValid = form.title.length >= MIN_TITLE_LENGTH && form.content.length >= MIN_CONTENT_LENGTH;

  useEffect(() => {
    loadLessons();
    loadCategories();
  }, []);

  const loadLessons = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchAllLessons();
      setLessons(data);
    } catch (err) {
      setError(`Error loading lessons: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const data = await fetchAllCategories();
      setCategories(data);
    } catch (err) {
      console.error('Error loading categories:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isFormValid) return;

    setError('');
    try {
      if (isEditing) {
        await updateLesson(editingId, form);
        setEditingId(null);
      } else {
        await createLesson(form);
      }
      setForm(initialForm);
      await loadLessons();
    } catch (err) {
      setError(`Error saving lesson: ${err.message}`);
    }
  };

  const handleEdit = (lesson) => {
    setEditingId(lesson.id);
    setForm({
      title: lesson.title || '',
      content: lesson.content || '',
      category_id: lesson.category_id || '',
      status: lesson.status || 'draft',
      featured_image: lesson.featured_image || '',
      code_snippets: lesson.code_snippets || '',
    });
    setActiveTab('form');
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure?')) return;
    try {
      await deleteLesson(id);
      await loadLessons();
    } catch (err) {
      setError(`Error deleting lesson: ${err.message}`);
    }
  };

  const handleStatusChange = async (lesson, newStatus) => {
    try {
      await updateLessonStatus(lesson.id, newStatus);
      await loadLessons();
    } catch (err) {
      setError(`Error updating lesson status: ${err.message}`);
    }
  };

  const filteredLessons = useMemo(() => {
    return lessons.filter((lesson) => {
      const matchesSearch = (lesson.title || '').toLowerCase().includes(query.toLowerCase());
      const matchesStatus = statusFilter === 'all' || lesson.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [lessons, query, statusFilter]);

  const totalPages = Math.ceil(filteredLessons.length / ITEMS_PER_PAGE);
  const pagedLessons = filteredLessons.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE,
  );

  const badgeClass = (status) => {
    const classes = {
      draft: 'bg-yellow-100 text-yellow-800',
      published: 'bg-green-100 text-green-800',
      archived: 'bg-gray-100 text-gray-800',
    };
    return classes[status] || 'bg-slate-100 text-slate-800';
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Lessons</h1>

      {error && (
        <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      {/* Mobile tab bar */}
      <div className="block md:hidden">
        <nav className="flex gap-2 overflow-auto pb-2">
          <button
            onClick={() => setActiveTab('form')}
            className={`flex-1 rounded-md px-3 py-2 text-sm font-medium ${
              activeTab === 'form'
                ? 'bg-indigo-600 text-white'
                : 'border border-slate-200 bg-white text-slate-700'
            }`}
          >
            Create
          </button>
          <button
            onClick={() => setActiveTab('preview')}
            className={`flex-1 rounded-md px-3 py-2 text-sm font-medium ${
              activeTab === 'preview'
                ? 'bg-indigo-600 text-white'
                : 'border border-slate-200 bg-white text-slate-700'
            }`}
          >
            Preview
          </button>
          <button
            onClick={() => setActiveTab('list')}
            className={`flex-1 rounded-md px-3 py-2 text-sm font-medium ${
              activeTab === 'list'
                ? 'bg-indigo-600 text-white'
                : 'border border-slate-200 bg-white text-slate-700'
            }`}
          >
            Lessons
          </button>
        </nav>
      </div>

      {/* Desktop / Tablet controls to toggle visibility */}
      <div className="hidden md:flex md:items-center md:justify-end md:gap-3">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={showForm} onChange={() => setShowForm((s) => !s)} /> Form
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={showPreview} onChange={() => setShowPreview((s) => !s)} />
          Preview
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={showList} onChange={() => setShowList((s) => !s)} /> List
        </label>
      </div>

      {/* Responsive layout: mobile shows single active panel; md shows 2 columns; lg shows 3 columns */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Form (left / top) */}
        {(showForm && (activeTab === 'form' || isDesktop)) && (
          <form ref={formRef} onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
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
              <button
                type="submit"
                disabled={!isFormValid}
                className="rounded bg-indigo-600 px-4 py-2 font-medium text-white disabled:opacity-50"
              >
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
        )}

        {/* Preview (middle) */}
        {(showPreview && (activeTab === 'preview' || isDesktop)) && (
          <section className="space-y-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-semibold">Live Preview</h2>
              <p className="text-sm text-slate-500">
                {isEditing ? 'Previewing current lesson edits.' : 'Previewing lesson draft before publishing.'}
              </p>
            </div>
            <PreviewContent
              title={form.title}
              content={form.content}
              codeSnippets={form.code_snippets}
            />
          </section>
        )}

        {/* List (right) */}
        {(showList && (activeTab === 'list' || isDesktop)) && (
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
        )}
      </div>

      {/* Mobile bottom sticky action bar for quick submit when form is active */}
      <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden">
        <div className="mx-auto max-w-7xl px-4 py-2">
          <div className="flex items-center justify-between gap-2 rounded-t-md bg-white/90 px-3 py-2 shadow backdrop-blur">
            <div className="text-sm text-slate-700">{isEditing ? 'Editing lesson' : 'Create new lesson'}</div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setEditingId(null);
                  setForm(initialForm);
                }}
                className="rounded bg-slate-200 px-3 py-2 text-sm font-medium"
              >
                Reset
              </button>
              <button
                onClick={() => formRef.current?.requestSubmit()}
                disabled={!isFormValid}
                className="rounded bg-indigo-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
              >
                {isEditing ? 'Update' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LessonsManagerPage;
