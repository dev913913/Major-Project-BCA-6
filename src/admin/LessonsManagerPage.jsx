import { useEffect, useMemo, useRef, useState } from 'react';
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
const TABLET_BREAKPOINT = 768; // Match Tailwind md: breakpoint

/**
 * Custom hook to detect if viewport matches a media query.
 * Safely handles SSR and reactive to window resize events.
 * @param {string} query - Media query string (e.g., '(min-width: 768px)')
 * @returns {boolean} True if query matches current viewport
 */
function useMediaQuery(query) {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    // Only run on client-side
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia(query);
    setMatches(mediaQuery.matches);

    const handler = (e) => setMatches(e.matches);
    mediaQuery.addEventListener('change', handler);

    return () => mediaQuery.removeEventListener('change', handler);
  }, [query]);

  return matches;
}

/**
 * Renders the live preview section with title, markdown content, and code snippets.
 * Memoized to prevent unnecessary re-renders.
 * @param {string} title - Lesson title
 * @param {string} content - Lesson content in Markdown
 * @param {Array} codeSnippets - Array of code snippet strings
 */
function PreviewContent({ title, content, codeSnippets }) {
  return (
    <article className="space-y-4 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-4">
      <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
        {title || 'Untitled Lesson'}
      </h3>
      <MarkdownRenderer content={content || 'Start writing to see a preview...'} />

      {codeSnippets && codeSnippets.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
            Code Snippets Preview
          </h4>
          {codeSnippets.map((snippet, index) => (
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
  if (status === 'published')
    return 'bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700';
  if (status === 'archived')
    return 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200';
  return 'bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-200';
}

/**
 * Admin lessons manager page with responsive mobile-first layout.
 * - Mobile: Tab navigation (Form, Preview, Lessons) + sticky action bar
 * - Tablet/Desktop: 2-3 column layout with toggle controls
 */
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
  const [activeTab, setActiveTab] = useState('form'); // Mobile tab: 'form' | 'preview' | 'list'
  const [showForm, setShowForm] = useState(true); // Desktop visibility toggle
  const [showPreview, setShowPreview] = useState(true);
  const [showList, setShowList] = useState(true);
  const formRef = useRef(null); // Reference for form submission with validation

  const isEditing = useMemo(() => Boolean(editingId), [editingId]);
  const isDesktop = useMediaQuery(`(min-width: ${TABLET_BREAKPOINT}px)`); // Reactive to window resize

  async function loadData() {
    try {
      setLoading(true);
      setError('');
      const [lessonList, categoryList] = await Promise.all([
        fetchAllLessons(),
        fetchCategories(),
      ]);
      setLessons(lessonList);
      setCategories(categoryList);
    } catch (err) {
      reportError('Admin lessons load', err);
      setError(
        friendlyErrorMessage('Unable to load lessons right now. Please try again.')
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const filteredLessons = useMemo(() => {
    return lessons.filter((lesson) => {
      const matchesQuery = lesson.title
        .toLowerCase()
        .includes(query.toLowerCase());
      const matchesStatus =
        statusFilter === 'all' ? true : lesson.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [lessons, query, statusFilter]);

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
      setError(
        friendlyErrorMessage('Unable to save lesson right now. Please try again.')
      );
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
    // Switch to form tab on mobile when editing
    if (!isDesktop) {
      setActiveTab('form');
    }
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
      setError(
        friendlyErrorMessage('Unable to delete lesson right now. Please try again.')
      );
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
      setError(
        friendlyErrorMessage(
          'Unable to update lesson status right now. Please try again.'
        )
      );
    }
  }

  /**
   * Triggers form submission via the DOM `requestSubmit()` API so that native
   * HTML5 validation runs before `handleSubmit` is called. Used by the mobile
   * sticky action bar's Save/Update button.
   */
  function handleMobileSave() {
    if (formRef.current) {
      // Use requestSubmit() to trigger proper HTML5 validation
      formRef.current.requestSubmit();
    }
  }

  const codeSnippets = mapTextareaToCodeSnippets(form.code_snippets);

  return (
    <div className="space-y-6 pb-24 md:pb-0">
      <h1 className="text-2xl font-semibold">Lessons</h1>

      {error && (
        <p className="rounded border border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/15 px-3 py-2 text-sm text-red-700 dark:text-red-300">
          {error}
        </p>
      )}

      {/* Mobile tab navigation */}
      <div className="block md:hidden">
        <nav className="flex gap-2 overflow-auto pb-2">
          <button
            onClick={() => setActiveTab('form')}
            className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              activeTab === 'form'
                ? 'bg-indigo-600 text-white'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700'
            }`}
          >
            Create
          </button>
          <button
            onClick={() => setActiveTab('preview')}
            className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              activeTab === 'preview'
                ? 'bg-indigo-600 text-white'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700'
            }`}
          >
            Preview
          </button>
          <button
            onClick={() => setActiveTab('list')}
            className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              activeTab === 'list'
                ? 'bg-indigo-600 text-white'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700'
            }`}
          >
            Lessons
          </button>
        </nav>
      </div>

      {/* Desktop / Tablet visibility toggles */}
      <div className="hidden md:flex md:items-center md:justify-end md:gap-3">
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={showForm}
            onChange={() => setShowForm((s) => !s)}
            className="cursor-pointer"
          />
          Form
        </label>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={showPreview}
            onChange={() => setShowPreview((s) => !s)}
            className="cursor-pointer"
          />
          Preview
        </label>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={showList}
            onChange={() => setShowList((s) => !s)}
            className="cursor-pointer"
          />
          List
        </label>
      </div>

      {/* Responsive grid layout: 1 column mobile, 2 columns tablet, 3 columns desktop */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Form Panel (left/top) */}
        {(showForm && (activeTab === 'form' || isDesktop)) && (
          <form
            ref={formRef}
            onSubmit={handleSubmit}
            className="space-y-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm"
          >
            <label className="block">
              <span className="mb-1 block text-sm font-medium">Title</span>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full rounded border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 px-3 py-2"
                required
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-medium">Content (Markdown)</span>
              <textarea
                rows={10}
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                className="w-full rounded border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 px-3 py-2 font-mono"
                required
              />
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1 block text-sm font-medium">Category</span>
                <select
                  value={form.category_id}
                  onChange={(e) =>
                    setForm({ ...form, category_id: e.target.value })
                  }
                  className="w-full rounded border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 px-3 py-2"
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
                  className="w-full rounded border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 px-3 py-2"
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
                onChange={(e) =>
                  setForm({ ...form, featured_image: e.target.value })
                }
                className="w-full rounded border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 px-3 py-2"
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-medium">
                Code Snippets (split snippets with --- line)
              </span>
              <textarea
                rows={6}
                value={form.code_snippets}
                onChange={(e) =>
                  setForm({ ...form, code_snippets: e.target.value })
                }
                className="w-full rounded border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 px-3 py-2 font-mono"
                placeholder="console.log('Hello World');"
              />
            </label>

            <div className="flex flex-wrap gap-2">
              <button
                type="submit"
                className="rounded bg-indigo-600 hover:bg-indigo-700 px-4 py-2 font-medium text-white transition-colors"
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
                  className="rounded bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 px-4 py-2 font-medium text-slate-700 dark:text-slate-200 transition-colors"
                >
                  Cancel
                </button>
              )}
              {isEditing && (
                <Link
                  to={`/lesson/${editingId}`}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 dark:hover:bg-slate-600 px-4 py-2 font-medium text-white transition-colors"
                >
                  Open Preview Page
                </Link>
              )}
            </div>
          </form>
        )}

        {/* Preview Panel (middle) */}
        {(showPreview && (activeTab === 'preview' || isDesktop)) && (
          <section className="space-y-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-semibold">Live Preview</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {isEditing
                  ? 'Previewing current lesson edits.'
                  : 'Previewing lesson draft before publishing.'}
              </p>
            </div>
            <PreviewContent
              title={form.title}
              content={form.content}
              codeSnippets={codeSnippets}
            />
          </section>
        )}

        {/* List Panel (right) */}
        {(showList && (activeTab === 'list' || isDesktop)) && (
          <div className="space-y-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full rounded border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 px-3 py-2 sm:max-w-xs"
                placeholder="Search lessons..."
              />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 px-3 py-2"
              >
                <option value="all">All statuses</option>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800 text-sm">
                <thead className="bg-slate-50 dark:bg-slate-950">
                  <tr>
                    <th className="px-4 py-2 text-left">Title</th>
                    <th className="px-4 py-2 text-left">Status</th>
                    <th className="px-4 py-2 text-left">Views</th>
                    <th className="px-4 py-2 text-left">Category</th>
                    <th className="px-4 py-2 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {loading ? (
                    <tr>
                      <td
                        className="px-4 py-4 text-slate-500 dark:text-slate-400"
                        colSpan={5}
                      >
                        Loading lessons...
                      </td>
                    </tr>
                  ) : (
                    pagedLessons.map((lesson) => (
                      <tr key={lesson.id}>
                        <td className="px-4 py-2 font-medium">{lesson.title}</td>
                        <td className="px-4 py-2">
                          <span
                            className={`rounded-full px-2 py-1 text-xs font-semibold ${
                              badgeClass(lesson.status)
                            }`}
                          >
                            {lesson.status}
                          </span>
                        </td>
                        <td className="px-4 py-2 font-semibold text-indigo-700 dark:text-indigo-200">
                          {lesson.views_count ?? 0}
                        </td>
                        <td className="px-4 py-2">
                          {lesson.categories?.name ?? 'N/A'}
                        </td>
                        <td className="px-4 py-2">
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              className="rounded bg-amber-100 dark:bg-amber-500/15 hover:bg-amber-200 dark:hover:bg-amber-500/25 px-3 py-1 text-amber-800 dark:text-amber-200 transition-colors"
                              onClick={() => handleEdit(lesson)}
                            >
                              Edit
                            </button>
                            <Link
                              to={`/lesson/${lesson.id}`}
                              target="_blank"
                              rel="noreferrer"
                              className="rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 px-3 py-1 text-slate-700 dark:text-slate-200 transition-colors"
                            >
                              {lesson.status === 'published'
                                ? 'View'
                                : 'Preview'}
                            </Link>
                            {lesson.status !== 'published' && (
                              <button
                                type="button"
                                className="rounded bg-emerald-100 dark:bg-emerald-500/15 hover:bg-emerald-200 dark:hover:bg-emerald-500/25 px-3 py-1 text-emerald-800 dark:text-emerald-200 transition-colors"
                                onClick={() =>
                                  handleStatusChange(lesson, 'published')
                                }
                              >
                                Publish
                              </button>
                            )}
                            {lesson.status !== 'archived' && (
                              <button
                                type="button"
                                className="rounded bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 px-3 py-1 text-slate-700 dark:text-slate-200 transition-colors"
                                onClick={() =>
                                  handleStatusChange(lesson, 'archived')
                                }
                              >
                                Archive
                              </button>
                            )}
                            {lesson.status !== 'draft' && (
                              <button
                                type="button"
                                className="rounded bg-indigo-100 dark:bg-indigo-500/20 hover:bg-indigo-200 dark:hover:bg-indigo-500/30 px-3 py-1 text-indigo-700 dark:text-indigo-200 transition-colors"
                                onClick={() =>
                                  handleStatusChange(lesson, 'draft')
                                }
                              >
                                Move to Draft
                              </button>
                            )}
                            <button
                              type="button"
                              className="rounded bg-red-100 dark:bg-red-500/15 hover:bg-red-200 dark:hover:bg-red-500/25 px-3 py-1 text-red-700 dark:text-red-300 transition-colors"
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
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Showing {pagedLessons.length} of {filteredLessons.length} lessons
              </p>
              <div className="space-x-2">
                <button
                  type="button"
                  className="rounded border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 px-3 py-1 disabled:opacity-50 transition-colors"
                  disabled={page <= 1}
                  onClick={() => setPage((prev) => prev - 1)}
                >
                  Prev
                </button>
                <span className="text-sm text-slate-600 dark:text-slate-300">
                  Page {page} / {totalPages}
                </span>
                <button
                  type="button"
                  className="rounded border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 px-3 py-1 disabled:opacity-50 transition-colors"
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

      {/* Mobile bottom sticky action bar for quick submit */}
      <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden border-t border-slate-200 dark:border-slate-800">
        <div className="mx-auto max-w-7xl px-4 py-2">
          <div className="flex items-center justify-between gap-2 bg-white dark:bg-slate-900 px-3 py-2 rounded-t-lg shadow-lg">
            <div className="text-sm text-slate-700 dark:text-slate-300">
              {isEditing ? 'Editing lesson' : 'Create new lesson'}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setEditingId(null);
                  setForm(initialForm);
                }}
                className="rounded bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 transition-colors"
              >
                Reset
              </button>
              <button
                onClick={handleMobileSave}
                className="rounded bg-indigo-600 hover:bg-indigo-700 px-3 py-2 text-sm font-medium text-white transition-colors"
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