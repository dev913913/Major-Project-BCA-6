import { useEffect, useMemo, useRef, useState } from 'react';
import {
  createLesson,
  deleteLesson,
  fetchAllLessons,
  updateLesson,
} from '../services/lessonService';
import { createCategory, fetchCategories } from '../services/categoryService';

const initialForm = {
  title: '',
  content: '## New Lesson\n\nStart writing your lesson content here.\n\n```c\n#include <stdio.h>\n\nint main() {\n  printf("Hello, ProgLearn!\\n");\n  return 0;\n}\n```',
  featured_image: '',
  category_id: '',
  status: 'draft',
  excerpt: '',
  meta_description: '',
};

const PAGE_SIZE = 20;

const STATUS_OPTIONS = ['draft', 'published', 'archived'];

function badgeClass(status) {
  if (status === 'published') return 'bg-emerald-100 text-emerald-700 border border-emerald-200';
  if (status === 'archived') return 'bg-slate-100 text-slate-700 border border-slate-200';
  return 'bg-amber-100 text-amber-700 border border-amber-200';
}

function getReadingTime(content) {
  const words = (content ?? '').trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

function excerptFromContent(content) {
  const cleaned = (content ?? '').replace(/[#>*`\-\n]/g, ' ').replace(/\s+/g, ' ').trim();
  return cleaned.slice(0, 150);
}

function formatDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleString();
}

function mapLessonToForm(lesson) {
  return {
    title: lesson.title ?? '',
    content: lesson.content ?? '',
    featured_image: lesson.featured_image ?? '',
    category_id: lesson.category_id ?? '',
    status: lesson.status ?? 'draft',
    excerpt: lesson.excerpt ?? '',
    meta_description: lesson.meta_description ?? '',
  };
}

function LessonsManagerPage() {
  const [lessons, setLessons] = useState([]);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [autosaveAt, setAutosaveAt] = useState(null);
  const [lastSavedAt, setLastSavedAt] = useState(null);
  const [importing, setImporting] = useState(false);

  const editorRef = useRef(null);
  const unsavedRef = useRef(false);

  const isEditing = useMemo(() => Boolean(editingId), [editingId]);
  const wordCount = useMemo(() => (form.content ?? '').trim().split(/\s+/).filter(Boolean).length, [form.content]);
  const readingTime = useMemo(() => getReadingTime(form.content), [form.content]);
  const effectiveExcerpt = useMemo(() => form.excerpt || excerptFromContent(form.content), [form.content, form.excerpt]);

  async function loadData() {
    try {
      setLoading(true);
      setError('');
      const [lessonList, categoryList] = await Promise.all([fetchAllLessons(), fetchCategories()]);
      setLessons(lessonList);
      setCategories(categoryList);
    } catch (err) {
      setError(err.message ?? 'Failed to load lessons.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!notice) return undefined;
    const timer = setTimeout(() => setNotice(''), 2800);
    return () => clearTimeout(timer);
  }, [notice]);

  useEffect(() => {
    const onBeforeUnload = (event) => {
      if (!unsavedRef.current) return;
      event.preventDefault();
      event.returnValue = '';
    };

    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, []);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === '?') {
        event.preventDefault();
        setShowShortcuts((prev) => !prev);
      }

      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
        event.preventDefault();
        handleSaveDraft();
      }

      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'b') {
        event.preventDefault();
        wrapSelection('**', '**');
      }

      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'i') {
        event.preventDefault();
        wrapSelection('*', '*');
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });

  useEffect(() => {
    const timer = setInterval(() => {
      if (!unsavedRef.current || !form.title.trim() || saving) return;
      handleSaveDraft(true);
    }, 30000);

    return () => clearInterval(timer);
  }, [form, saving]);

  const filteredLessons = useMemo(() => {
    const normalized = query.toLowerCase();
    const sorted = lessons
      .filter((lesson) => {
        const matchesQuery = lesson.title.toLowerCase().includes(normalized) || (lesson.content ?? '').toLowerCase().includes(normalized);
        const matchesStatus = statusFilter === 'all' || lesson.status === statusFilter;
        const matchesCategory = categoryFilter === 'all' || String(lesson.category_id) === categoryFilter;
        return matchesQuery && matchesStatus && matchesCategory;
      })
      .sort((a, b) => {
        if (sortBy === 'oldest') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        if (sortBy === 'views') return (b.views_count ?? 0) - (a.views_count ?? 0);
        if (sortBy === 'title') return a.title.localeCompare(b.title);
        return new Date(b.updated_at ?? b.created_at).getTime() - new Date(a.updated_at ?? a.created_at).getTime();
      });

    return sorted;
  }, [lessons, query, statusFilter, categoryFilter, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filteredLessons.length / PAGE_SIZE));

  const pagedLessons = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredLessons.slice(start, start + PAGE_SIZE);
  }, [filteredLessons, page]);

  useEffect(() => {
    setPage(1);
  }, [query, statusFilter, categoryFilter, sortBy]);

  function updateForm(patch) {
    unsavedRef.current = true;
    setForm((prev) => ({ ...prev, ...patch }));
  }

  function resetEditor() {
    setForm(initialForm);
    setEditingId(null);
    unsavedRef.current = false;
  }

  function insertAtCursor(before, after = '') {
    const textarea = editorRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = form.content.slice(start, end);
    const next = `${form.content.slice(0, start)}${before}${selected}${after}${form.content.slice(end)}`;
    updateForm({ content: next });
    requestAnimationFrame(() => {
      textarea.focus();
      textarea.selectionStart = start + before.length;
      textarea.selectionEnd = end + before.length;
    });
  }

  function wrapSelection(before, after) {
    insertAtCursor(before, after);
  }

  function applyBlock(prefix) {
    const textarea = editorRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = form.content.slice(start, end) || 'Text';
    const lines = selected.split('\n').map((line) => `${prefix}${line}`);
    const next = `${form.content.slice(0, start)}${lines.join('\n')}${form.content.slice(end)}`;
    updateForm({ content: next });
  }

  function insertCodeBlock(language = 'c') {
    insertAtCursor(`\n\n` + '```' + `${language}\n`, '\n```\n\n');
  }

  function duplicateLesson(lesson) {
    setForm({
      ...mapLessonToForm(lesson),
      title: `${lesson.title} (Copy)`,
      status: 'draft',
    });
    setEditingId(null);
    setNotice('Lesson duplicated into editor.');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function handleSubmit(statusOverride) {
    if (!form.title.trim() || !form.content.trim()) {
      setError('Title and content are required.');
      return;
    }

    try {
      setSaving(true);
      setError('');
      const payload = {
        ...form,
        status: statusOverride ?? form.status,
        category_id: form.category_id || null,
        code_snippets: [],
        excerpt: effectiveExcerpt,
        meta_description: form.meta_description || effectiveExcerpt.slice(0, 160),
      };

      if (isEditing) {
        await updateLesson(editingId, payload);
      } else {
        const created = await createLesson(payload);
        setEditingId(created.id);
      }

      unsavedRef.current = false;
      setLastSavedAt(new Date());
      setNotice(statusOverride === 'published' ? 'Lesson published successfully.' : 'Lesson saved.');
      await loadData();
    } catch (err) {
      setError(err.message ?? 'Failed to save lesson.');
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveDraft(isAuto = false) {
    if (isAuto) setAutosaveAt(new Date());
    await handleSubmit('draft');
  }

  function handleEdit(lesson) {
    setEditingId(lesson.id);
    setForm(mapLessonToForm(lesson));
    unsavedRef.current = false;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this lesson permanently?')) return;

    try {
      setError('');
      await deleteLesson(id);
      if (editingId === id) resetEditor();
      setNotice('Lesson deleted.');
      await loadData();
    } catch (err) {
      setError(err.message ?? 'Failed to delete lesson.');
    }
  }

  async function applyBulkAction(action) {
    if (selectedIds.length === 0) return;

    try {
      setSaving(true);
      if (action === 'delete') {
        await Promise.all(selectedIds.map((id) => deleteLesson(id)));
      } else {
        await Promise.all(selectedIds.map((id) => updateLesson(id, { status: action })));
      }
      setNotice(`Bulk action applied to ${selectedIds.length} lesson(s).`);
      setSelectedIds([]);
      await loadData();
    } catch (err) {
      setError(err.message ?? 'Bulk action failed.');
    } finally {
      setSaving(false);
    }
  }

  async function handleAddCategory() {
    const name = window.prompt('New category name:');
    if (!name) return;

    try {
      const newCategory = await createCategory({ name, difficulty: 'beginner' });
      setCategories((prev) => [...prev, { ...newCategory, lesson_count: 0 }].sort((a, b) => a.name.localeCompare(b.name)));
      updateForm({ category_id: newCategory.id });
    } catch (err) {
      setError(err.message ?? 'Failed to create category.');
    }
  }

  async function handleImportLessons(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setImporting(true);
      const text = await file.text();
      const parsed = JSON.parse(text);
      const records = Array.isArray(parsed) ? parsed : [parsed];

      for (const record of records) {
        const payload = {
          title: record.title ?? 'Imported Lesson',
          content: record.content ?? '## Imported\n\nNo content provided.',
          featured_image: record.featured_image ?? '',
          status: STATUS_OPTIONS.includes(record.status) ? record.status : 'draft',
          category_id: record.category_id ?? null,
          excerpt: record.excerpt ?? excerptFromContent(record.content),
          meta_description: record.meta_description ?? excerptFromContent(record.content).slice(0, 160),
          code_snippets: [],
        };
        await createLesson(payload);
      }

      setNotice(`Imported ${records.length} lesson(s).`);
      await loadData();
    } catch (err) {
      setError(`Import failed: ${err.message ?? 'Invalid file format.'}`);
    } finally {
      event.target.value = '';
      setImporting(false);
    }
  }

  async function createDemoCLesson() {
    const demoContent = `# C Programming Fundamentals\n\nWelcome to this practical C programming lesson. In this guide, we'll build a strong foundation using variables, loops, conditions, functions, and arrays.\n\n## 1) Your first C program\n\n\`\`\`c\n#include <stdio.h>\n\nint main() {\n  printf("Hello from ProgLearn by Dev Kumar!\\n");\n  return 0;\n}\n\`\`\`\n\n## 2) Variables and data types\n\nC is statically typed. You must declare a variable before using it.\n\n\`\`\`c\nint age = 21;\nfloat gpa = 8.7f;\nchar grade = 'A';\n\`\`\`\n\n## 3) Conditionals\n\n\`\`\`c\nif (age >= 18) {\n  printf("You are an adult.\\n");\n} else {\n  printf("You are a minor.\\n");\n}\n\`\`\`\n\n## 4) Loops\n\n\`\`\`c\nfor (int i = 1; i <= 5; i++) {\n  printf("Step %d\\n", i);\n}\n\`\`\`\n\n## 5) Functions\n\n\`\`\`c\nint add(int a, int b) {\n  return a + b;\n}\n\nint main() {\n  printf("Sum: %d\\n", add(4, 5));\n  return 0;\n}\n\`\`\`\n\n## 6) Arrays\n\n\`\`\`c\nint scores[] = {90, 85, 92, 88};\nint size = sizeof(scores) / sizeof(scores[0]);\n\nfor (int i = 0; i < size; i++) {\n  printf("Score %d: %d\\n", i + 1, scores[i]);\n}\n\`\`\`\n\n## Practice Challenge\n\nWrite a C program that accepts 5 integers and prints the largest value.\n\n> Tip: Use a loop and a running maximum variable.\n\nHappy coding!`;

    try {
      setSaving(true);
      await createLesson({
        title: 'C Programming Fundamentals: Variables, Loops, Functions & Arrays',
        content: demoContent,
        featured_image: '',
        category_id: null,
        status: 'published',
        excerpt: 'Master C programming fundamentals with practical examples covering variables, conditions, loops, functions, and arrays.',
        meta_description: 'A complete beginner-friendly C programming lesson with examples, explanations, and practice challenge.',
        code_snippets: [],
      });
      setNotice('Demo C lesson created and published.');
      await loadData();
    } catch (err) {
      setError(err.message ?? 'Failed to create demo lesson.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Lessons CMS</h1>
          <p className="text-sm text-slate-500">Professional editor with autosave, inline code blocks, import, and bulk controls.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <label className="inline-flex cursor-pointer items-center rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
            {importing ? 'Importing...' : 'Import Lessons'}
            <input type="file" accept="application/json" className="hidden" onChange={handleImportLessons} disabled={importing} />
          </label>
          <button type="button" onClick={createDemoCLesson} className="rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-100">
            Add Demo C Lesson
          </button>
          <button
            type="button"
            onClick={() => {
              resetEditor();
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            Create New Lesson
          </button>
        </div>
      </div>

      {error && <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      {notice && <p className="rounded border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{notice}</p>}

      <section className="grid gap-4 xl:grid-cols-[1fr,320px]">
        <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-lg font-semibold">{isEditing ? 'Edit Lesson' : 'Create Lesson'}</h2>
              <p className="text-xs text-slate-500">
                {saving ? 'Saving...' : 'Saved'} {lastSavedAt ? `• Last saved ${formatDate(lastSavedAt)}` : ''} {autosaveAt ? `• Autosave ${formatDate(autosaveAt)}` : ''}
              </p>
            </div>
            <button type="button" onClick={() => setShowPreview((prev) => !prev)} className="rounded-md border border-slate-300 px-3 py-1.5 text-sm">
              {showPreview ? 'Edit mode' : 'Preview mode'}
            </button>
          </div>

          <input
            type="text"
            value={form.title}
            onChange={(event) => updateForm({ title: event.target.value })}
            placeholder="Lesson title"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-lg font-semibold"
          />

          {!showPreview && (
            <div className="flex flex-wrap gap-2 rounded-lg border border-slate-200 bg-slate-50 p-2 text-sm">
              <button type="button" className="rounded bg-white px-2 py-1" onClick={() => wrapSelection('**', '**')}>Bold</button>
              <button type="button" className="rounded bg-white px-2 py-1" onClick={() => wrapSelection('*', '*')}>Italic</button>
              <button type="button" className="rounded bg-white px-2 py-1" onClick={() => wrapSelection('<u>', '</u>')}>Underline</button>
              <button type="button" className="rounded bg-white px-2 py-1" onClick={() => applyBlock('# ')}>H1</button>
              <button type="button" className="rounded bg-white px-2 py-1" onClick={() => applyBlock('## ')}>H2</button>
              <button type="button" className="rounded bg-white px-2 py-1" onClick={() => applyBlock('### ')}>H3</button>
              <button type="button" className="rounded bg-white px-2 py-1" onClick={() => applyBlock('- ')}>Bulleted list</button>
              <button type="button" className="rounded bg-white px-2 py-1" onClick={() => applyBlock('1. ')}>Numbered list</button>
              <button type="button" className="rounded bg-white px-2 py-1" onClick={() => applyBlock('> ')}>Quote</button>
              <button type="button" className="rounded bg-white px-2 py-1" onClick={() => insertAtCursor('[', '](https://)')}>Link</button>
              <button type="button" className="rounded bg-white px-2 py-1" onClick={() => wrapSelection('`', '`')}>Inline code</button>
              <button type="button" className="rounded bg-white px-2 py-1" onClick={() => insertCodeBlock('c')}>Code block</button>
              <button type="button" className="rounded bg-white px-2 py-1" onClick={() => insertAtCursor('![alt text](', ')')}>Image</button>
            </div>
          )}

          {showPreview ? (
            <article className="min-h-[480px] rounded-xl border border-slate-200 bg-slate-50 p-4">
              <pre className="whitespace-pre-wrap font-sans text-sm text-slate-700">{form.content}</pre>
            </article>
          ) : (
            <textarea
              ref={editorRef}
              rows={18}
              value={form.content}
              onChange={(event) => updateForm({ content: event.target.value })}
              className="min-h-[480px] w-full rounded-xl border border-slate-300 px-3 py-3 font-mono text-sm"
              placeholder="Write your lesson in markdown... Try ## headings, **bold**, and ```c for code blocks."
            />
          )}

          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
            <p>{wordCount} words • {form.content.length} characters • ~{readingTime} min read</p>
            <button type="button" onClick={() => setShowShortcuts((prev) => !prev)} className="underline">Keyboard shortcuts (?)</button>
          </div>

          {showShortcuts && (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
              <p><strong>Ctrl/Cmd + B</strong> Bold</p>
              <p><strong>Ctrl/Cmd + I</strong> Italic</p>
              <p><strong>Ctrl/Cmd + S</strong> Save draft</p>
              <p><strong>?</strong> Toggle this panel</p>
            </div>
          )}
        </div>

        <aside className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <section className="space-y-2">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Status</h3>
            <select value={form.status} onChange={(event) => updateForm({ status: event.target.value })} className="w-full rounded border border-slate-300 px-3 py-2">
              {STATUS_OPTIONS.map((status) => <option key={status} value={status}>{status}</option>)}
            </select>
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={() => handleSaveDraft(false)} className="rounded bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700">Save Draft</button>
              <button type="button" onClick={() => handleSubmit('published')} className="rounded bg-emerald-600 px-3 py-2 text-sm font-semibold text-white">Publish</button>
            </div>
            <button
              type="button"
              onClick={() => window.open(`/lesson/${editingId ?? ''}`, '_blank')}
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
              disabled={!editingId}
            >
              Preview in new tab
            </button>
          </section>

          <section className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Category</h3>
              <button type="button" onClick={handleAddCategory} className="text-xs text-indigo-600">+ Add New</button>
            </div>
            <select value={form.category_id} onChange={(event) => updateForm({ category_id: event.target.value })} className="w-full rounded border border-slate-300 px-3 py-2">
              <option value="">No category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>
          </section>

          <section className="space-y-2">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Featured Image</h3>
            <input
              type="url"
              value={form.featured_image}
              onChange={(event) => updateForm({ featured_image: event.target.value })}
              placeholder="https://image-url..."
              className="w-full rounded border border-slate-300 px-3 py-2"
            />
            <p className="text-xs text-slate-500">Recommended size: 1200x630px</p>
            {form.featured_image ? <img src={form.featured_image} alt="Featured preview" className="max-h-36 w-full rounded object-cover" /> : <div className="rounded border border-dashed border-slate-300 p-4 text-center text-xs text-slate-500">No image selected</div>}
            {form.featured_image && <button type="button" onClick={() => updateForm({ featured_image: '' })} className="text-xs text-red-600">Remove image</button>}
          </section>

          <section className="space-y-2">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Excerpt</h3>
            <textarea
              rows={3}
              value={form.excerpt}
              maxLength={150}
              onChange={(event) => updateForm({ excerpt: event.target.value })}
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
              placeholder="Manual excerpt (150 chars max)."
            />
            <p className="text-xs text-slate-500">{effectiveExcerpt.length}/150 • Auto-generated if left empty.</p>
          </section>

          <details className="rounded border border-slate-200 p-3" open>
            <summary className="cursor-pointer text-sm font-semibold uppercase tracking-wide text-slate-500">SEO</summary>
            <div className="mt-2 space-y-2">
              <textarea
                rows={3}
                maxLength={160}
                value={form.meta_description}
                onChange={(event) => updateForm({ meta_description: event.target.value })}
                className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
                placeholder="Meta description (160 chars max)."
              />
              <p className="text-xs text-slate-500">Google preview:</p>
              <div className="rounded border border-slate-200 bg-slate-50 p-2">
                <p className="text-sm font-semibold text-indigo-700">{form.title || 'Lesson title'}</p>
                <p className="text-xs text-slate-600">{(form.meta_description || effectiveExcerpt || 'Lesson description preview').slice(0, 160)}</p>
              </div>
            </div>
          </details>

          <p className="text-xs text-slate-500">Estimated reading time: ~{readingTime} min read</p>
        </aside>
      </section>

      <section className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="grid w-full gap-2 md:grid-cols-4">
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="rounded border border-slate-300 px-3 py-2"
              placeholder="Search title or content..."
            />
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded border border-slate-300 px-3 py-2">
              <option value="all">All statuses</option>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
            <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="rounded border border-slate-300 px-3 py-2">
              <option value="all">All categories</option>
              {categories.map((category) => <option key={category.id} value={String(category.id)}>{category.name}</option>)}
            </select>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="rounded border border-slate-300 px-3 py-2">
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="views">Most Views</option>
              <option value="title">Title A-Z</option>
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button type="button" className="rounded border border-slate-300 px-3 py-1.5 text-sm" onClick={() => applyBulkAction('published')} disabled={!selectedIds.length}>Bulk Publish</button>
          <button type="button" className="rounded border border-slate-300 px-3 py-1.5 text-sm" onClick={() => applyBulkAction('archived')} disabled={!selectedIds.length}>Bulk Archive</button>
          <button type="button" className="rounded border border-red-300 px-3 py-1.5 text-sm text-red-700" onClick={() => applyBulkAction('delete')} disabled={!selectedIds.length}>Bulk Delete</button>
          <span className="text-xs text-slate-500">{selectedIds.length} selected</span>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-3 py-2 text-left"><input type="checkbox" checked={pagedLessons.length > 0 && selectedIds.length === pagedLessons.length} onChange={(event) => setSelectedIds(event.target.checked ? pagedLessons.map((lesson) => lesson.id) : [])} /></th>
                <th className="px-3 py-2 text-left">Thumbnail</th>
                <th className="px-3 py-2 text-left">Title</th>
                <th className="px-3 py-2 text-left">Status</th>
                <th className="px-3 py-2 text-left">Category</th>
                <th className="px-3 py-2 text-left">Views</th>
                <th className="px-3 py-2 text-left">Updated</th>
                <th className="px-3 py-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td className="px-3 py-4 text-slate-500" colSpan={8}>Loading lessons...</td></tr>
              ) : pagedLessons.length === 0 ? (
                <tr><td className="px-3 py-4 text-slate-500" colSpan={8}>No lessons found.</td></tr>
              ) : (
                pagedLessons.map((lesson) => (
                  <tr key={lesson.id}>
                    <td className="px-3 py-2"><input type="checkbox" checked={selectedIds.includes(lesson.id)} onChange={(event) => setSelectedIds((prev) => event.target.checked ? [...new Set([...prev, lesson.id])] : prev.filter((id) => id !== lesson.id))} /></td>
                    <td className="px-3 py-2">
                      {lesson.featured_image ? <img src={lesson.featured_image} alt={lesson.title} className="h-10 w-16 rounded object-cover" /> : <div className="h-10 w-16 rounded bg-gradient-to-br from-indigo-500 to-violet-500" />}
                    </td>
                    <td className="px-3 py-2 font-medium text-indigo-700">
                      <button type="button" onClick={() => handleEdit(lesson)} className="text-left hover:underline">{lesson.title}</button>
                    </td>
                    <td className="px-3 py-2"><span className={`rounded-full px-2 py-1 text-xs font-semibold ${badgeClass(lesson.status)}`}>{lesson.status}</span></td>
                    <td className="px-3 py-2">{lesson.categories?.name ?? 'N/A'}</td>
                    <td className="px-3 py-2">👁 {lesson.views_count ?? 0}</td>
                    <td className="px-3 py-2">{formatDate(lesson.updated_at ?? lesson.created_at)}</td>
                    <td className="space-x-2 px-3 py-2">
                      <button type="button" className="rounded bg-indigo-100 px-2 py-1 text-indigo-700" onClick={() => handleEdit(lesson)}>Edit</button>
                      <button type="button" className="rounded bg-emerald-100 px-2 py-1 text-emerald-700" onClick={() => window.open(`/lesson/${lesson.id}`, '_blank')}>View</button>
                      <button type="button" className="rounded bg-amber-100 px-2 py-1 text-amber-700" onClick={() => duplicateLesson(lesson)}>Duplicate</button>
                      <button type="button" className="rounded bg-red-100 px-2 py-1 text-red-700" onClick={() => handleDelete(lesson.id)}>Delete</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600">
          <p>
            Showing {(page - 1) * PAGE_SIZE + (pagedLessons.length ? 1 : 0)}-{(page - 1) * PAGE_SIZE + pagedLessons.length} of {filteredLessons.length} lessons
          </p>
          <div className="flex items-center gap-2">
            <button type="button" className="rounded border border-slate-300 px-3 py-1" disabled={page <= 1} onClick={() => setPage((prev) => Math.max(1, prev - 1))}>Prev</button>
            <span>Page {page} / {totalPages}</span>
            <button type="button" className="rounded border border-slate-300 px-3 py-1" disabled={page >= totalPages} onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}>Next</button>
          </div>
        </div>
      </section>
    </div>
  );
}

export default LessonsManagerPage;
