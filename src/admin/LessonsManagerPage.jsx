import { useEffect, useMemo, useRef, useState } from 'react';
import MarkdownRenderer from '../components/MarkdownRenderer';
import {
  createLesson,
  deleteLesson,
  fetchAllLessons,
  updateLesson,
} from '../services/lessonService';
import { fetchCategories } from '../services/categoryService';
import { friendlyErrorMessage, reportError } from '../utils/errorUtils';

const PAGE_SIZE = 8;

const initialForm = {
  title: '',
  featured_image: '',
  category_id: '',
  status: 'draft',
};

function uid(prefix = 'block') {
  return `${prefix}-${crypto.randomUUID?.() ?? `${Date.now()}-${Math.random()}`}`;
}

function createTextBlock(content = '') {
  return { id: uid('text'), type: 'text', content };
}

function createCodeBlock(code = '', language = 'javascript') {
  return { id: uid('code'), type: 'code', language: language || 'javascript', content: code };
}

function compileBlocksToMarkdown(blocks) {
  return blocks
    .map((block) => {
      if (block.type === 'code') {
        return `\n\n\`\`\`${block.language || 'javascript'}\n${block.content || ''}\n\`\`\`\n\n`;
      }
      return block.content || '';
    })
    .join('\n\n')
    .trim();
}

function parseContentToBlocks(content = '', snippets = []) {
  const blocks = [];
  const regex = /```([\w-]+)?\n([\s\S]*?)```/g;
  let lastIndex = 0;
  let match = regex.exec(content);

  while (match) {
    const before = content.slice(lastIndex, match.index).trim();
    if (before) blocks.push(createTextBlock(before));
    blocks.push(createCodeBlock(match[2].trim(), match[1] || 'javascript'));
    lastIndex = regex.lastIndex;
    match = regex.exec(content);
  }

  const remaining = content.slice(lastIndex).trim();
  if (remaining) blocks.push(createTextBlock(remaining));

  if (blocks.length === 0 && Array.isArray(snippets) && snippets.length > 0) {
    snippets.forEach((snippet) => {
      if (typeof snippet === 'string') blocks.push(createCodeBlock(snippet, 'javascript'));
      else if (snippet && typeof snippet === 'object') {
        blocks.push(createCodeBlock(snippet.code ?? snippet.content ?? '', snippet.language ?? snippet.lang ?? 'javascript'));
      }
    });
  }

  return blocks.length > 0 ? blocks : [createTextBlock('## New Lesson\n\nWrite your lesson content here.')];
}

function extractTitleFromMarkdown(content = '') {
  const line = content.split('\n').find((entry) => entry.trim().startsWith('# '));
  return line ? line.replace(/^#\s+/, '').trim() : '';
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
  const [blocks, setBlocks] = useState([createTextBlock('## New Lesson\n\nWrite your lesson content here.')]);
  const [editingId, setEditingId] = useState(null);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTextBlockId, setActiveTextBlockId] = useState(null);
  const [importName, setImportName] = useState('');
  const dragBlockId = useRef('');
  const textareasRef = useRef({});

  const isEditing = useMemo(() => Boolean(editingId), [editingId]);
  const markdownPreview = useMemo(() => compileBlocksToMarkdown(blocks), [blocks]);

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

  useEffect(() => setPage(1), [query, statusFilter]);

  function resetEditor() {
    setForm(initialForm);
    setBlocks([createTextBlock('## New Lesson\n\nWrite your lesson content here.')]);
    setEditingId(null);
    setActiveTextBlockId(null);
    setImportName('');
  }

  function updateBlock(blockId, key, value) {
    setBlocks((prev) => prev.map((block) => (block.id === blockId ? { ...block, [key]: value } : block)));
  }

  function addBlock(type) {
    setBlocks((prev) => [...prev, type === 'code' ? createCodeBlock('', 'javascript') : createTextBlock('')]);
  }

  function deleteBlock(blockId) {
    setBlocks((prev) => {
      const next = prev.filter((block) => block.id !== blockId);
      return next.length > 0 ? next : [createTextBlock('')];
    });
  }

  function moveBlock(blockId, direction) {
    setBlocks((prev) => {
      const index = prev.findIndex((block) => block.id === blockId);
      if (index < 0) return prev;
      const target = direction === 'up' ? index - 1 : index + 1;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  function applyFormat(type) {
    const blockId = activeTextBlockId;
    const textarea = textareasRef.current[blockId];
    if (!blockId || !textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const value = textarea.value;
    const selected = value.slice(start, end);

    const wrappers = {
      bold: ['**', '**'],
      italic: ['*', '*'],
      h2: ['## ', ''],
      h3: ['### ', ''],
      ul: ['- ', ''],
      ol: ['1. ', ''],
      quote: ['> ', ''],
    };

    const [before, after] = wrappers[type] ?? ['', ''];
    const insertion = `${before}${selected || 'text'}${after}`;
    const nextValue = `${value.slice(0, start)}${insertion}${value.slice(end)}`;
    updateBlock(blockId, 'content', nextValue);

    requestAnimationFrame(() => {
      textarea.focus();
      const cursor = start + insertion.length;
      textarea.setSelectionRange(cursor, cursor);
    });
  }

  function onDragStart(blockId) {
    dragBlockId.current = blockId;
  }

  function onDrop(targetId) {
    const sourceId = dragBlockId.current;
    if (!sourceId || sourceId === targetId) return;

    setBlocks((prev) => {
      const sourceIndex = prev.findIndex((b) => b.id === sourceId);
      const targetIndex = prev.findIndex((b) => b.id === targetId);
      if (sourceIndex < 0 || targetIndex < 0) return prev;
      const next = [...prev];
      const [moved] = next.splice(sourceIndex, 1);
      next.splice(targetIndex, 0, moved);
      return next;
    });

    dragBlockId.current = '';
  }

  async function handleFileImport(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      setImportName(file.name);

      if (file.name.endsWith('.json')) {
        const parsed = JSON.parse(text);
        const nextTitle = parsed.title || extractTitleFromMarkdown(parsed.content || '') || '';
        const nextBlocks = Array.isArray(parsed.blocks)
          ? parsed.blocks.map((entry) =>
              entry.type === 'code'
                ? createCodeBlock(entry.content ?? '', entry.language ?? 'javascript')
                : createTextBlock(entry.content ?? ''),
            )
          : parseContentToBlocks(parsed.content ?? '', parsed.code_snippets ?? []);

        setForm((prev) => ({
          ...prev,
          title: nextTitle || prev.title,
          featured_image: parsed.featured_image ?? prev.featured_image,
          category_id: parsed.category_id ?? prev.category_id,
          status: parsed.status ?? prev.status,
        }));
        setBlocks(nextBlocks);
      } else {
        const guessedTitle = extractTitleFromMarkdown(text);
        if (guessedTitle) setForm((prev) => ({ ...prev, title: prev.title || guessedTitle }));
        setBlocks(parseContentToBlocks(text));
      }
    } catch (err) {
      reportError('Lesson import parse', err);
      setError(friendlyErrorMessage('Unable to read this file. Please use .md, .txt, or valid .json.'));
    } finally {
      event.target.value = '';
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const content = compileBlocksToMarkdown(blocks);
    const codeSnippets = blocks
      .filter((block) => block.type === 'code' && block.content.trim())
      .map((block, index) => ({
        id: `snippet-${index + 1}`,
        title: `Code Snippet ${index + 1}`,
        language: block.language || 'javascript',
        code: block.content,
      }));

    const payload = {
      ...form,
      content,
      category_id: form.category_id || null,
      code_snippets: codeSnippets,
    };

    try {
      setError('');
      if (isEditing) await updateLesson(editingId, payload);
      else await createLesson(payload);
      resetEditor();
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
      featured_image: lesson.featured_image ?? '',
      category_id: lesson.category_id ?? '',
      status: lesson.status ?? 'draft',
    });
    setBlocks(parseContentToBlocks(lesson.content ?? '', lesson.code_snippets ?? []));
  }

  async function handleDelete(id) {
    try {
      setError('');
      await deleteLesson(id);
      if (editingId === id) resetEditor();
      await loadData();
    } catch (err) {
      reportError('Admin lesson delete', err);
      setError(friendlyErrorMessage('Unable to delete lesson right now. Please try again.'));
    }
  }

  async function handleQuickStatusToggle(lesson) {
    const nextStatus = lesson.status === 'published' ? 'draft' : 'published';
    try {
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

      <form onSubmit={handleSubmit} className="space-y-5 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-4 sm:grid-cols-2">
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
            <span className="mb-1 block text-sm font-medium">Featured Image URL</span>
            <input
              type="url"
              value={form.featured_image}
              onChange={(e) => setForm({ ...form, featured_image: e.target.value })}
              className="w-full rounded border border-slate-300 px-3 py-2"
            />
          </label>

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

        <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-3">
          <p className="text-sm font-medium text-slate-700">Import lesson file (.md, .txt, .json)</p>
          <div className="mt-2 flex items-center gap-3">
            <label className="cursor-pointer rounded bg-indigo-600 px-3 py-2 text-sm font-medium text-white">
              Choose File
              <input type="file" accept=".md,.txt,.json" className="hidden" onChange={handleFileImport} />
            </label>
            <p className="text-xs text-slate-500">{importName || 'No file imported yet'}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 rounded-lg border border-slate-200 p-3">
          <button type="button" onClick={() => applyFormat('bold')} className="rounded bg-slate-100 px-3 py-1 text-sm">Bold</button>
          <button type="button" onClick={() => applyFormat('italic')} className="rounded bg-slate-100 px-3 py-1 text-sm">Italic</button>
          <button type="button" onClick={() => applyFormat('h2')} className="rounded bg-slate-100 px-3 py-1 text-sm">H2</button>
          <button type="button" onClick={() => applyFormat('h3')} className="rounded bg-slate-100 px-3 py-1 text-sm">H3</button>
          <button type="button" onClick={() => applyFormat('ul')} className="rounded bg-slate-100 px-3 py-1 text-sm">Bullet</button>
          <button type="button" onClick={() => applyFormat('ol')} className="rounded bg-slate-100 px-3 py-1 text-sm">Numbered</button>
          <button type="button" onClick={() => applyFormat('quote')} className="rounded bg-slate-100 px-3 py-1 text-sm">Quote</button>
          <button type="button" onClick={() => addBlock('text')} className="rounded bg-indigo-100 px-3 py-1 text-sm text-indigo-700">+ Text Block</button>
          <button type="button" onClick={() => addBlock('code')} className="rounded bg-indigo-100 px-3 py-1 text-sm text-indigo-700">+ Code Block</button>
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          <section className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Content Blocks (drag to reorder)</h2>
            {blocks.map((block, index) => (
              <article
                key={block.id}
                draggable
                onDragStart={() => onDragStart(block.id)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => onDrop(block.id)}
                className="space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-3"
              >
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  <span className="rounded bg-white px-2 py-1 font-semibold">{block.type.toUpperCase()} #{index + 1}</span>
                  {block.type === 'code' && (
                    <select
                      value={block.language || 'javascript'}
                      onChange={(e) => updateBlock(block.id, 'language', e.target.value)}
                      className="rounded border border-slate-300 bg-white px-2 py-1 text-xs"
                    >
                      {['javascript', 'typescript', 'python', 'bash', 'css', 'sql', 'json', 'html'].map((lang) => (
                        <option key={lang} value={lang}>{lang}</option>
                      ))}
                    </select>
                  )}
                  <button type="button" className="rounded bg-white px-2 py-1" onClick={() => moveBlock(block.id, 'up')}>↑</button>
                  <button type="button" className="rounded bg-white px-2 py-1" onClick={() => moveBlock(block.id, 'down')}>↓</button>
                  <button type="button" className="rounded bg-red-100 px-2 py-1 text-red-700" onClick={() => deleteBlock(block.id)}>Delete</button>
                </div>

                {block.type === 'code' ? (
                  <textarea
                    rows={8}
                    value={block.content}
                    onChange={(e) => updateBlock(block.id, 'content', e.target.value)}
                    className="w-full rounded border border-slate-300 bg-slate-900 p-3 font-mono text-sm text-slate-100"
                    placeholder="Write code..."
                  />
                ) : (
                  <textarea
                    rows={8}
                    ref={(el) => {
                      if (el) textareasRef.current[block.id] = el;
                    }}
                    value={block.content}
                    onFocus={() => setActiveTextBlockId(block.id)}
                    onChange={(e) => updateBlock(block.id, 'content', e.target.value)}
                    className="w-full rounded border border-slate-300 bg-white p-3 text-sm"
                    placeholder="Write markdown content..."
                  />
                )}
              </article>
            ))}
          </section>

          <section className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Live Preview</h2>
            <div className="max-h-[900px] overflow-y-auto rounded-lg border border-slate-200 bg-slate-50 p-2">
              <MarkdownRenderer content={markdownPreview || '*Preview will appear here*'} />
            </div>
          </section>
        </div>

        <div className="flex gap-2">
          <button type="submit" className="rounded bg-indigo-600 px-4 py-2 font-medium text-white">
            {isEditing ? 'Update Lesson' : 'Create Lesson'}
          </button>
          {(isEditing || form.title || importName) && (
            <button type="button" onClick={resetEditor} className="rounded bg-slate-200 px-4 py-2 font-medium text-slate-700">
              Reset Editor
            </button>
          )}
        </div>
      </form>

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
                  <td className="px-4 py-4 text-slate-500" colSpan={5}>Loading lessons...</td>
                </tr>
              ) : (
                pagedLessons.map((lesson) => (
                  <tr key={lesson.id}>
                    <td className="px-4 py-2 font-medium">{lesson.title}</td>
                    <td className="px-4 py-2">
                      <span className={`rounded-full px-2 py-1 text-xs font-semibold ${badgeClass(lesson.status)}`}>{lesson.status}</span>
                    </td>
                    <td className="px-4 py-2 font-semibold text-indigo-700">{lesson.views_count ?? 0}</td>
                    <td className="px-4 py-2">{lesson.categories?.name ?? 'N/A'}</td>
                    <td className="space-x-2 px-4 py-2">
                      <button type="button" className="rounded bg-amber-100 px-3 py-1 text-amber-800" onClick={() => handleEdit(lesson)}>Edit</button>
                      <button type="button" className="rounded bg-indigo-100 px-3 py-1 text-indigo-700" onClick={() => handleQuickStatusToggle(lesson)}>
                        {lesson.status === 'published' ? 'Unpublish' : 'Publish'}
                      </button>
                      <button type="button" className="rounded bg-red-100 px-3 py-1 text-red-700" onClick={() => handleDelete(lesson.id)}>Delete</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500">Showing {pagedLessons.length} of {filteredLessons.length} lessons</p>
          <div className="space-x-2">
            <button type="button" className="rounded border border-slate-300 px-3 py-1 disabled:opacity-50" disabled={page <= 1} onClick={() => setPage((prev) => prev - 1)}>Prev</button>
            <span className="text-sm text-slate-600">Page {page} / {totalPages}</span>
            <button type="button" className="rounded border border-slate-300 px-3 py-1 disabled:opacity-50" disabled={page >= totalPages} onClick={() => setPage((prev) => prev + 1)}>Next</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LessonsManagerPage;
