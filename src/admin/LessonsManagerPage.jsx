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
import { badgeClass, mapCodeSnippetsToTextarea, mapTextareaToCodeSnippets } from '../utils/lessonFormUtils';

const initialForm = {
  title: '',
  content: '## New Lesson\n\nWrite your lesson in Markdown.',
  code_snippets: '',
  featured_image: '',
  category_id: '',
  status: 'draft',
};

const PAGE_SIZE = 8;

const EDITOR_ACTIONS = [
  { label: 'H2', before: '## ', placeholder: 'Section title' },
  { label: 'Bold', before: '**', after: '**', placeholder: 'important text' },
  { label: 'List', before: '- ', placeholder: 'List item' },
  { label: 'Quote', before: '> ', placeholder: 'Helpful note' },
  { label: 'Code', before: '```javascript\n', after: '\n```', placeholder: "console.log('example');" },
];

function getLessonStats(form) {
  const words = form.content.trim() ? form.content.trim().split(/\s+/).length : 0;
  const minutes = Math.max(1, Math.ceil(words / 180));
  const snippets = mapTextareaToCodeSnippets(form.code_snippets).length;
  const hasImage = Boolean(form.featured_image.trim());

  return { words, minutes, snippets, hasImage };
}

/**
 * Custom React hook that tracks whether a CSS media query currently matches.
 * Safe to use in SSR environments — defaults to `false` on the server.
 *
 * @param {string} query - A valid CSS media query string (e.g. `'(min-width: 768px)'`).
 * @returns {boolean} `true` when the media query matches, `false` otherwise.
 */
function useMediaQuery(query) {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;

    const mediaQueryList = window.matchMedia(query);
    
    // Set initial value
    setMatches(mediaQueryList.matches);

    // Handler for changes
    const handler = (e) => setMatches(e.matches);
    
    // Add listener (support both old and new API)
    if (mediaQueryList.addEventListener) {
      mediaQueryList.addEventListener('change', handler);
    } else {
      mediaQueryList.addListener(handler);
    }

    // Cleanup
    return () => {
      if (mediaQueryList.removeEventListener) {
        mediaQueryList.removeEventListener('change', handler);
      } else {
        mediaQueryList.removeListener(handler);
      }
    };
  }, [query]);

  return matches;
}

/**
 * Renders a read-only preview of the lesson being authored, including the title,
 * Markdown body, and any code snippets. Defined outside the parent component so
 * React does not recreate it on every render.
 *
 * @param {Object} props
 * @param {Object} props.form - Current lesson form state.
 * @param {string} props.form.title - Lesson title.
 * @param {string} props.form.content - Lesson body in Markdown.
 * @param {string} props.form.code_snippets - Raw textarea value of code snippets.
 * @returns {JSX.Element} Article element with rendered preview content.
 */
const PreviewContent = ({ form }) => {
  const codeSnippets = mapTextareaToCodeSnippets(form.code_snippets);

  return (
    <article className="space-y-4 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-4">
      <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{form.title || 'Untitled Lesson'}</h3>
      <MarkdownRenderer content={form.content || 'Start writing to see a preview...'} />

      {codeSnippets.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Code Snippets Preview</h4>
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
};

/**
 * Admin page for managing lessons. Provides a responsive, tabbed interface with
 * three panels: a lesson creation/edit form, a live Markdown preview, and a
 * searchable/paginated list of existing lessons. On mobile a sticky bottom bar
 * exposes quick-save and reset actions regardless of the active tab.
 *
 * @returns {JSX.Element} The full lessons management admin page.
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
  const [savedAt, setSavedAt] = useState(null);

  // UI visibility controls
  const [activeTab, setActiveTab] = useState('form'); // 'form' | 'preview' | 'list'
  const [showForm, setShowForm] = useState(true);
  const [showPreview, setShowPreview] = useState(true);
  const [showList, setShowList] = useState(true);

  // Form reference for proper validation
  const formRef = useRef(null);
  const contentRef = useRef(null);

  // Responsive hook for md breakpoint (768px)
  const isDesktop = useMediaQuery('(min-width: 768px)');

  const isEditing = useMemo(() => Boolean(editingId), [editingId]);
  const lessonStats = useMemo(() => getLessonStats(form), [form]);

  /**
   * Fetches all lessons and categories from the API and updates component state.
   * Sets `loading` during the request and populates `error` on failure.
   *
   * @returns {Promise<void>}
   */
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


  useEffect(() => {
    if (typeof window === 'undefined') return;
    const savedDraft = window.localStorage.getItem('adminLessonDraft');
    if (!savedDraft) return;

    try {
      const parsedDraft = JSON.parse(savedDraft);
      setForm({ ...initialForm, ...parsedDraft });
    } catch {
      window.localStorage.removeItem('adminLessonDraft');
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || isEditing) return;
    const timeoutId = window.setTimeout(() => {
      window.localStorage.setItem('adminLessonDraft', JSON.stringify(form));
      setSavedAt(new Date());
    }, 600);

    return () => window.clearTimeout(timeoutId);
  }, [form, isEditing]);

  const filteredLessons = useMemo(() => {
    return lessons.filter((lesson) => {
      const matchesQuery = lesson.title.toLowerCase().includes(query.toLowerCase());
      const matchesStatus = statusFilter === 'all' ? true : lesson.status === statusFilter;
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

  /**
   * Handles lesson form submission. Creates a new lesson or updates the lesson
   * currently being edited, reloads the list, resets the form, and switches to
   * the list tab on mobile.
   *
   * @param {React.FormEvent<HTMLFormElement>} event - The form submit event.
   * @returns {Promise<void>}
   */
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
      if (typeof window !== 'undefined') window.localStorage.removeItem('adminLessonDraft');
      await loadData();

      // After saving, show list on mobile for quick access
      setActiveTab('list');
    } catch (err) {
      reportError('Admin lesson save', err);
      setError(friendlyErrorMessage('Unable to save lesson right now. Please try again.'));
    }
  }

  /**
   * Populates the form with the given lesson's data so the admin can edit it.
   * On mobile, switches the active tab to the form panel.
   *
   * @param {Object} lesson - The lesson object to edit.
   * @param {string|number} lesson.id - Unique lesson identifier.
   * @param {string} lesson.title - Lesson title.
   * @param {string} lesson.content - Lesson body in Markdown.
   * @param {Array} lesson.code_snippets - Existing code snippets array.
   * @param {string} lesson.featured_image - URL of the featured image.
   * @param {string|number} lesson.category_id - Associated category identifier.
   * @param {string} lesson.status - Publication status of the lesson.
   */
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

    // On mobile, switch to form when editing
    setActiveTab('form');
  }

  /**
   * Deletes the lesson with the given ID. If the deleted lesson is currently being
   * edited, the form is reset. Reloads the lesson list on success.
   *
   * @param {string|number} id - The ID of the lesson to delete.
   * @returns {Promise<void>}
   */
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

  /**
   * Updates the publication status of a lesson. No-ops if the lesson already has
   * the requested status. Reloads the lesson list on success.
   *
   * @param {Object} lesson - The lesson whose status should change.
   * @param {string|number} lesson.id - Unique lesson identifier.
   * @param {string} lesson.status - Current status of the lesson.
   * @param {'draft'|'published'|'archived'} nextStatus - The desired new status.
   * @returns {Promise<void>}
   */
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


  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function resetComposer() {
    setEditingId(null);
    setForm(initialForm);
    if (typeof window !== 'undefined') window.localStorage.removeItem('adminLessonDraft');
  }

  function insertMarkdown(before, after = '', placeholder = '') {
    const textarea = contentRef.current;
    const start = textarea?.selectionStart ?? form.content.length;
    const end = textarea?.selectionEnd ?? form.content.length;
    const selected = form.content.slice(start, end) || placeholder;
    const nextContent = `${form.content.slice(0, start)}${before}${selected}${after}${form.content.slice(end)}`;
    updateField('content', nextContent);

    window.requestAnimationFrame(() => {
      if (!textarea) return;
      textarea.focus();
      const cursorStart = start + before.length;
      textarea.setSelectionRange(cursorStart, cursorStart + selected.length);
    });
  }

  function applyStarterTemplate() {
    updateField(
      'content',
      `## Learning goals\n\n- Understand the main concept\n- Build a small example\n- Practice with a quick challenge\n\n## Explanation\n\nWrite the lesson story here.\n\n## Example\n\n\`\`\`javascript\nconsole.log('Hello lesson');\n\`\`\`\n\n## Practice task\n\nAsk learners to apply what they learned.`,
    );
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

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-600 via-violet-600 to-sky-500 p-5 text-white shadow-sm dark:border-indigo-500/30">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-100">Lesson Studio</p>
            <h1 className="mt-2 text-3xl font-bold">Create sharper lessons faster</h1>
            <p className="mt-2 max-w-2xl text-sm text-indigo-50">Draft with Markdown shortcuts, watch quality signals update live, and manage publishing from one smooth workspace.</p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:min-w-[520px]">
            <MiniMetric label="Words" value={lessonStats.words} />
            <MiniMetric label="Read" value={`${lessonStats.minutes} min`} />
            <MiniMetric label="Snippets" value={lessonStats.snippets} />
            <MiniMetric label="Image" value={lessonStats.hasImage ? 'Ready' : 'Missing'} />
          </div>
        </div>
      </section>

      {error && (
        <p className="rounded border border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/15 px-3 py-2 text-sm text-red-700 dark:text-red-300">{error}</p>
      )}

      {/* Mobile tab bar */}
      <div className="block md:hidden">
        <nav className="flex gap-2 overflow-auto pb-2">
          <button
            onClick={() => setActiveTab('form')}
            className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              activeTab === 'form'
                ? 'bg-indigo-600 text-white'
                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800'
            }`}
          >
            Create
          </button>
          <button
            onClick={() => setActiveTab('preview')}
            className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              activeTab === 'preview'
                ? 'bg-indigo-600 text-white'
                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800'
            }`}
          >
            Preview
          </button>
          <button
            onClick={() => setActiveTab('list')}
            className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              activeTab === 'list'
                ? 'bg-indigo-600 text-white'
                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800'
            }`}
          >
            Lessons
          </button>
        </nav>
      </div>

      {/* Desktop / Tablet controls to toggle visibility */}
      <div className="hidden md:flex md:items-center md:justify-end md:gap-3">
        <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200 cursor-pointer">
          <input
            type="checkbox"
            checked={showForm}
            onChange={() => setShowForm((s) => !s)}
            className="accent-indigo-600 dark:accent-indigo-500"
          />{' '}
          Form
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200 cursor-pointer">
          <input
            type="checkbox"
            checked={showPreview}
            onChange={() => setShowPreview((s) => !s)}
            className="accent-indigo-600 dark:accent-indigo-500"
          />{' '}
          Preview
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200 cursor-pointer">
          <input
            type="checkbox"
            checked={showList}
            onChange={() => setShowList((s) => !s)}
            className="accent-indigo-600 dark:accent-indigo-500"
          />{' '}
          List
        </label>
      </div>

      {/* Responsive layout: mobile shows single active panel; md shows 2 columns; lg shows 3 columns */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Form (left / top) */}
        {showForm && (activeTab === 'form' || isDesktop) && (
          <form
            ref={formRef}
            onSubmit={handleSubmit}
            className="space-y-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 lg:col-span-2"
          >
            <div className="flex flex-col gap-2 border-b border-slate-100 pb-4 dark:border-slate-800 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold">{isEditing ? 'Edit lesson' : 'New lesson draft'}</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">Use the guided composer below, then review the live preview before publishing.</p>
              </div>
              {savedAt && !isEditing && <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200">Autosaved {savedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>}
            </div>

            <label className="block">
              <span className="mb-1 block text-sm font-medium">Lesson title</span>
              <input
                type="text"
                value={form.title}
                onChange={(e) => updateField('title', e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-3 text-lg font-semibold dark:border-slate-700"
                placeholder="e.g. JavaScript arrays made simple"
                required
              />
            </label>

            <div className="rounded-xl border border-slate-200 dark:border-slate-800">
              <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 bg-slate-50 p-2 dark:border-slate-800 dark:bg-slate-950">
                {EDITOR_ACTIONS.map((action) => (
                  <button
                    key={action.label}
                    type="button"
                    onClick={() => insertMarkdown(action.before, action.after, action.placeholder)}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-indigo-300 hover:text-indigo-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                  >
                    {action.label}
                  </button>
                ))}
                <button type="button" onClick={applyStarterTemplate} className="ml-auto rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-100 dark:bg-indigo-500/15 dark:text-indigo-200">Starter template</button>
              </div>
              <label className="block">
                <span className="sr-only">Content (Markdown)</span>
                <textarea
                  ref={contentRef}
                  rows={18}
                  value={form.content}
                  onChange={(e) => updateField('content', e.target.value)}
                  className="min-h-[460px] w-full rounded-b-xl border-0 px-4 py-3 font-mono text-sm leading-7 focus:ring-0"
                  required
                />
              </label>
              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 px-3 py-2 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
                <span>{lessonStats.words} words · about {lessonStats.minutes} min read</span>
                <span>Tip: split standalone code snippets with a line containing only ---</span>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1 block text-sm font-medium">Category</span>
                <select
                  value={form.category_id}
                  onChange={(e) => updateField('category_id', e.target.value)}
                  className="w-full rounded border border-slate-300 dark:border-slate-700 px-3 py-2"
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
                  onChange={(e) => updateField('status', e.target.value)}
                  className="w-full rounded border border-slate-300 dark:border-slate-700 px-3 py-2"
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
                onChange={(e) => updateField('featured_image', e.target.value)}
                className="w-full rounded border border-slate-300 dark:border-slate-700 px-3 py-2"
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-medium">Code Snippets (split snippets with --- line)</span>
              <textarea
                rows={6}
                value={form.code_snippets}
                onChange={(e) => updateField('code_snippets', e.target.value)}
                className="w-full rounded border border-slate-300 dark:border-slate-700 px-3 py-2 font-mono"
                placeholder="console.log('Hello World');"
              />
            </label>

            <div className="flex flex-wrap gap-2">
              <button type="submit" className="rounded bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700 transition-colors">
                {isEditing ? 'Update Lesson' : 'Create Lesson'}
              </button>
              {isEditing && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingId(null);
                    resetComposer();
                  }}
                  className="rounded bg-slate-200 dark:bg-slate-700 px-4 py-2 font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-300 transition-colors"
                >
                  Cancel
                </button>
              )}
              {isEditing && (
                <Link
                  to={`/lesson/${editingId}`}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded bg-slate-900 px-4 py-2 font-medium text-white hover:bg-slate-800 transition-colors"
                >
                  Open Preview Page
                </Link>
              )}
            </div>
          </form>
        )}

        {/* Preview (middle) */}
        {showPreview && (activeTab === 'preview' || isDesktop) && (
          <section className="space-y-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-semibold">Live Preview</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">{isEditing ? 'Previewing current lesson edits.' : 'Previewing lesson draft before publishing.'}</p>
            </div>

            <PreviewContent form={form} />
          </section>
        )}

        {/* List (right) */}
        {showList && (activeTab === 'list' || isDesktop) && (
          <div className="space-y-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full rounded border border-slate-300 dark:border-slate-700 px-3 py-2 sm:max-w-xs"
                placeholder="Search lessons..."
              />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded border border-slate-300 dark:border-slate-700 px-3 py-2"
              >
                <option value="all">All statuses</option>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
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
                      <td className="px-4 py-4 text-slate-500 dark:text-slate-400" colSpan={5}>
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
                        <td className="px-4 py-2 font-semibold text-indigo-700 dark:text-indigo-200">{lesson.views_count ?? 0}</td>
                        <td className="px-4 py-2">{lesson.categories?.name ?? 'N/A'}</td>
                        <td className="px-4 py-2">
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              className="rounded bg-amber-100 dark:bg-amber-500/15 px-3 py-1 text-amber-800 dark:text-amber-200 hover:bg-amber-200 transition-colors"
                              onClick={() => handleEdit(lesson)}
                            >
                              Edit
                            </button>
                            <Link
                              to={`/lesson/${lesson.id}`}
                              target="_blank"
                              rel="noreferrer"
                              className="rounded bg-slate-100 dark:bg-slate-800 px-3 py-1 text-slate-700 dark:text-slate-200 hover:bg-slate-200 transition-colors"
                            >
                              {lesson.status === 'published' ? 'View' : 'Preview'}
                            </Link>
                            {lesson.status !== 'published' && (
                              <button
                                type="button"
                                className="rounded bg-emerald-100 dark:bg-emerald-500/15 px-3 py-1 text-emerald-800 hover:bg-emerald-200 transition-colors"
                                onClick={() => handleStatusChange(lesson, 'published')}
                              >
                                Publish
                              </button>
                            )}
                            {lesson.status !== 'archived' && (
                              <button
                                type="button"
                                className="rounded bg-slate-200 dark:bg-slate-700 px-3 py-1 text-slate-700 dark:text-slate-200 hover:bg-slate-300 transition-colors"
                                onClick={() => handleStatusChange(lesson, 'archived')}
                              >
                                Archive
                              </button>
                            )}
                            {lesson.status !== 'draft' && (
                              <button
                                type="button"
                                className="rounded bg-indigo-100 dark:bg-indigo-500/20 px-3 py-1 text-indigo-700 dark:text-indigo-200 hover:bg-indigo-200 transition-colors"
                                onClick={() => handleStatusChange(lesson, 'draft')}
                              >
                                Move to Draft
                              </button>
                            )}
                            <button
                              type="button"
                              className="rounded bg-red-100 dark:bg-red-500/15 px-3 py-1 text-red-700 dark:text-red-300 hover:bg-red-200 transition-colors"
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
              <p className="text-sm text-slate-500 dark:text-slate-400">Showing {pagedLessons.length} of {filteredLessons.length} lessons</p>
              <div className="space-x-2">
                <button
                  type="button"
                  className="rounded border border-slate-300 dark:border-slate-700 px-3 py-1 disabled:opacity-50 hover:bg-slate-50 transition-colors"
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
                  className="rounded border border-slate-300 dark:border-slate-700 px-3 py-1 disabled:opacity-50 hover:bg-slate-50 transition-colors"
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
          <div className="flex items-center justify-between gap-2 rounded-t-md bg-white/90 dark:bg-slate-900/90 px-3 py-2 shadow backdrop-blur">
            <div className="text-sm text-slate-700 dark:text-slate-200">{isEditing ? 'Editing lesson' : 'Create new lesson'}</div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  resetComposer();
                }}
                className="rounded bg-slate-200 dark:bg-slate-700 px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={handleMobileSave}
                className="rounded bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
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

function MiniMetric({ label, value }) {
  return (
    <div className="rounded-xl bg-white/15 p-3 backdrop-blur">
      <p className="text-xs font-medium uppercase tracking-wide text-indigo-100">{label}</p>
      <p className="mt-1 text-xl font-bold">{value}</p>
    </div>
  );
}

export default LessonsManagerPage;
