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
  content: '',
  code_snippets: '',
  featured_image: '',
  category_id: '',
  status: 'draft',
};

const PAGE_SIZE = 8;

const EDITOR_ACTIONS = [
  { label: 'Heading', before: '## ', placeholder: 'Section title' },
  { label: 'Bold', before: '**', after: '**', placeholder: 'important text' },
  { label: 'Bulleted list', before: '- ', placeholder: 'List item' },
  { label: 'Quote', before: '> ', placeholder: 'Helpful note' },
  { label: 'Code block', before: '```javascript\n', after: '\n```', placeholder: "console.log('example');" },
];

const EDITOR_TABS = [
  { id: 'compose', label: 'Compose' },
  { id: 'markdown', label: 'Markdown' },
];

const MOBILE_TABS = [
  { id: 'editor', label: 'Editor' },
  { id: 'preview', label: 'Preview' },
  { id: 'lessons', label: 'Lessons' },
];

const PreviewContent = ({ form }) => {
  const codeSnippets = mapTextareaToCodeSnippets(form.code_snippets);

  return (
    <article className="space-y-4 rounded-xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
      <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{form.title || 'Untitled Lesson'}</h3>
      <MarkdownRenderer content={form.content || 'Start writing to see a preview...'} />

      {codeSnippets.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Extra Code Snippets</h4>
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
  const [editorMode, setEditorMode] = useState('compose');
  const [mobileTab, setMobileTab] = useState('editor');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const formRef = useRef(null);
  const contentRef = useRef(null);

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

      resetComposer();
      await loadData();
      setMobileTab('lessons');
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
    setShowAdvanced(Boolean(lesson.code_snippets?.length));
    setEditorMode('compose');
    setMobileTab('editor');
  }

  async function handleDelete(id) {
    try {
      setError('');
      await deleteLesson(id);
      if (editingId === id) resetComposer();
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

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function resetComposer() {
    setEditingId(null);
    setForm(initialForm);
    setEditorMode('compose');
    setShowAdvanced(false);
  }

  function clearBody() {
    updateField('content', '');
    contentRef.current?.focus();
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

  function handleMobileSave() {
    formRef.current?.requestSubmit();
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Lessons</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Create, edit, preview, and publish lessons from a simple editor workspace.</p>
        </div>
        <button
          type="button"
          onClick={resetComposer}
          className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          New blank lesson
        </button>
      </header>

      {error && (
        <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/15 dark:text-red-300">{error}</p>
      )}

      <div className="block md:hidden">
        <nav className="flex gap-2 overflow-auto pb-2">
          {MOBILE_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setMobileTab(tab.id)}
              className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                mobileTab === tab.id
                  ? 'bg-indigo-600 text-white'
                  : 'border border-slate-200 bg-white text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="space-y-6">
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">
          <div className={mobileTab === 'editor' ? 'block' : 'hidden md:block'}>
            <LessonEditor
              form={form}
              categories={categories}
              contentRef={contentRef}
              editorMode={editorMode}
              formRef={formRef}
              isEditing={isEditing}
              showAdvanced={showAdvanced}
              onClearBody={clearBody}
              onEditorModeChange={setEditorMode}
              onFieldChange={updateField}
              onInsertMarkdown={insertMarkdown}
              onShowAdvancedChange={setShowAdvanced}
              onSubmit={handleSubmit}
              onReset={resetComposer}
              editingId={editingId}
            />
          </div>

          <section className={`${mobileTab === 'preview' ? 'block' : 'hidden xl:block'} space-y-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900`}>
            <div>
              <h2 className="text-lg font-semibold">Preview</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">This is how the lesson will render for readers.</p>
            </div>
            <PreviewContent form={form} />
          </section>
        </div>

        <div className={mobileTab === 'lessons' ? 'block' : 'hidden md:block'}>
          <LessonsTable
            filteredLessons={filteredLessons}
            loading={loading}
            page={page}
            pagedLessons={pagedLessons}
            query={query}
            statusFilter={statusFilter}
            totalPages={totalPages}
            onDelete={handleDelete}
            onEdit={handleEdit}
            onPageChange={setPage}
            onQueryChange={setQuery}
            onStatusChange={handleStatusChange}
            onStatusFilterChange={setStatusFilter}
          />
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden">
        <div className="mx-auto max-w-7xl px-4 py-2">
          <div className="flex items-center justify-between gap-2 rounded-t-md bg-white/90 px-3 py-2 shadow backdrop-blur dark:bg-slate-900/90">
            <div className="text-sm text-slate-700 dark:text-slate-200">{isEditing ? 'Editing lesson' : 'New blank lesson'}</div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={resetComposer}
                className="rounded bg-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={handleMobileSave}
                className="rounded bg-indigo-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
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

function LessonEditor({
  form,
  categories,
  contentRef,
  editorMode,
  formRef,
  isEditing,
  showAdvanced,
  onClearBody,
  onEditorModeChange,
  onFieldChange,
  onInsertMarkdown,
  onShowAdvancedChange,
  onSubmit,
  onReset,
  editingId,
}) {
  return (
    <form
      ref={formRef}
      onSubmit={onSubmit}
      className="space-y-5 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900"
    >
      <div className="flex flex-col gap-2 border-b border-slate-100 pb-4 dark:border-slate-800 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold">{isEditing ? 'Edit lesson' : 'New lesson'}</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Start blank, write in Compose, or switch to Markdown for source editing.</p>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
          {editorMode === 'compose' ? 'Compose view' : 'Markdown view'}
        </span>
      </div>

      <label className="block">
        <span className="mb-1 block text-sm font-medium">Title</span>
        <input
          type="text"
          value={form.title}
          onChange={(e) => onFieldChange('title', e.target.value)}
          className="w-full rounded-lg border border-slate-300 px-3 py-3 text-lg font-semibold dark:border-slate-700"
          placeholder="Add lesson title"
          required
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-3">
        <label className="block sm:col-span-2">
          <span className="mb-1 block text-sm font-medium">Category</span>
          <select
            value={form.category_id}
            onChange={(e) => onFieldChange('category_id', e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-700"
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
            onChange={(e) => onFieldChange('status', e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-700"
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>
        </label>
      </div>

      <label className="block">
        <span className="mb-1 block text-sm font-medium">Featured image URL</span>
        <input
          type="url"
          value={form.featured_image}
          onChange={(e) => onFieldChange('featured_image', e.target.value)}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-700"
          placeholder="https://example.com/image.jpg"
        />
      </label>

      <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 bg-slate-50 p-2 dark:border-slate-800 dark:bg-slate-950">
          <div className="flex rounded-lg border border-slate-200 bg-white p-1 dark:border-slate-700 dark:bg-slate-900">
            {EDITOR_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => onEditorModeChange(tab.id)}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                  editorMode === tab.id
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-1">
            {EDITOR_ACTIONS.map((action) => (
              <button
                key={action.label}
                type="button"
                onClick={() => onInsertMarkdown(action.before, action.after, action.placeholder)}
                className="rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 transition hover:border-indigo-300 hover:text-indigo-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
              >
                {action.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={onClearBody}
            className="ml-auto rounded-md px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-500/10"
          >
            Clear body
          </button>
        </div>

        <label className="block">
          <span className="sr-only">Lesson body</span>
          <textarea
            ref={contentRef}
            rows={editorMode === 'compose' ? 18 : 20}
            value={form.content}
            onChange={(e) => onFieldChange('content', e.target.value)}
            className={`min-h-[460px] w-full border-0 px-5 py-4 focus:ring-0 ${
              editorMode === 'compose'
                ? 'text-base leading-8 text-slate-900 dark:text-slate-100'
                : 'font-mono text-sm leading-7 text-slate-900 dark:text-slate-100'
            }`}
            placeholder={editorMode === 'compose' ? 'Write your lesson here...' : 'Write or edit Markdown source here...'}
            required
          />
        </label>

        <div className="border-t border-slate-100 px-4 py-2 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
          {editorMode === 'compose'
            ? 'Use the toolbar for headings, lists, quotes, and code blocks.'
            : 'Markdown mode supports headings, lists, links, blockquotes, and fenced code blocks.'}
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 dark:border-slate-800">
        <button
          type="button"
          onClick={() => onShowAdvancedChange((current) => !current)}
          className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-semibold text-slate-700 dark:text-slate-200"
        >
          Advanced: extra code snippets
          <span className="text-xs text-slate-500">{showAdvanced ? 'Hide' : 'Show'}</span>
        </button>
        {showAdvanced && (
          <div className="space-y-2 border-t border-slate-100 p-4 dark:border-slate-800">
            <p className="text-sm text-slate-500 dark:text-slate-400">Optional. Most examples can go directly in the lesson body using the Code block button.</p>
            <textarea
              rows={5}
              value={form.code_snippets}
              onChange={(e) => onFieldChange('code_snippets', e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm dark:border-slate-700"
              placeholder="console.log('Hello World');"
            />
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <button type="submit" className="rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white transition-colors hover:bg-indigo-700">
          {isEditing ? 'Update lesson' : 'Create lesson'}
        </button>
        <button
          type="button"
          onClick={onReset}
          className="rounded-lg bg-slate-200 px-4 py-2 font-medium text-slate-700 transition-colors hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600"
        >
          Clear all
        </button>
        {isEditing && (
          <Link
            to={`/lesson/${editingId}`}
            target="_blank"
            rel="noreferrer"
            className="rounded-lg bg-slate-900 px-4 py-2 font-medium text-white transition-colors hover:bg-slate-800"
          >
            Open preview page
          </Link>
        )}
      </div>
    </form>
  );
}

function LessonsTable({
  filteredLessons,
  loading,
  page,
  pagedLessons,
  query,
  statusFilter,
  totalPages,
  onDelete,
  onEdit,
  onPageChange,
  onQueryChange,
  onStatusChange,
  onStatusFilterChange,
}) {
  return (
    <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-lg font-semibold">All lessons</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Search, edit, and manage publication status.</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            type="search"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 sm:w-72 dark:border-slate-700"
            placeholder="Search lessons..."
          />
          <select
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-700"
          >
            <option value="all">All statuses</option>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
        <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-800">
          <thead className="bg-slate-50 dark:bg-slate-950">
            <tr>
              <th className="w-2/5 px-4 py-3 text-left font-semibold">Title</th>
              <th className="px-4 py-3 text-left font-semibold">Status</th>
              <th className="px-4 py-3 text-left font-semibold">Views</th>
              <th className="px-4 py-3 text-left font-semibold">Category</th>
              <th className="px-4 py-3 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {loading ? (
              <tr>
                <td className="px-4 py-4 text-slate-500 dark:text-slate-400" colSpan={5}>
                  Loading lessons...
                </td>
              </tr>
            ) : pagedLessons.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-center text-slate-500 dark:text-slate-400" colSpan={5}>
                  No lessons match your filters.
                </td>
              </tr>
            ) : (
              pagedLessons.map((lesson) => (
                <tr key={lesson.id} className="align-top transition hover:bg-slate-50 dark:hover:bg-slate-950">
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-900 dark:text-slate-100">{lesson.title}</p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">ID: {lesson.id}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-1 text-xs font-semibold ${badgeClass(lesson.status)}`}>
                      {lesson.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-semibold text-indigo-700 dark:text-indigo-200">{lesson.views_count ?? 0}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{lesson.categories?.name ?? 'N/A'}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap justify-end gap-2">
                      <button
                        type="button"
                        className="rounded-md bg-amber-100 px-3 py-1 text-amber-800 transition-colors hover:bg-amber-200 dark:bg-amber-500/15 dark:text-amber-200"
                        onClick={() => onEdit(lesson)}
                      >
                        Edit
                      </button>
                      <Link
                        to={`/lesson/${lesson.id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-md bg-slate-100 px-3 py-1 text-slate-700 transition-colors hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200"
                      >
                        {lesson.status === 'published' ? 'View' : 'Preview'}
                      </Link>
                      {lesson.status !== 'published' && (
                        <button
                          type="button"
                          className="rounded-md bg-emerald-100 px-3 py-1 text-emerald-800 transition-colors hover:bg-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-200"
                          onClick={() => onStatusChange(lesson, 'published')}
                        >
                          Publish
                        </button>
                      )}
                      {lesson.status !== 'archived' && (
                        <button
                          type="button"
                          className="rounded-md bg-slate-200 px-3 py-1 text-slate-700 transition-colors hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-200"
                          onClick={() => onStatusChange(lesson, 'archived')}
                        >
                          Archive
                        </button>
                      )}
                      {lesson.status !== 'draft' && (
                        <button
                          type="button"
                          className="rounded-md bg-indigo-100 px-3 py-1 text-indigo-700 transition-colors hover:bg-indigo-200 dark:bg-indigo-500/20 dark:text-indigo-200"
                          onClick={() => onStatusChange(lesson, 'draft')}
                        >
                          Draft
                        </button>
                      )}
                      <button
                        type="button"
                        className="rounded-md bg-red-100 px-3 py-1 text-red-700 transition-colors hover:bg-red-200 dark:bg-red-500/15 dark:text-red-300"
                        onClick={() => onDelete(lesson.id)}
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

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-500 dark:text-slate-400">Showing {pagedLessons.length} of {filteredLessons.length} lessons</p>
        <div className="space-x-2">
          <button
            type="button"
            className="rounded border border-slate-300 px-3 py-1 transition-colors hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:hover:bg-slate-800"
            disabled={page <= 1}
            onClick={() => onPageChange((prev) => prev - 1)}
          >
            Prev
          </button>
          <span className="text-sm text-slate-600 dark:text-slate-300">
            Page {page} / {totalPages}
          </span>
          <button
            type="button"
            className="rounded border border-slate-300 px-3 py-1 transition-colors hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:hover:bg-slate-800"
            disabled={page >= totalPages}
            onClick={() => onPageChange((prev) => prev + 1)}
          >
            Next
          </button>
        </div>
      </div>
    </section>
  );
}

export default LessonsManagerPage;
