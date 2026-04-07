import { supabase } from './supabaseClient';

function normalizeText(value, fallback = '') {
  if (typeof value === 'string') return value;
  if (value == null) return fallback;
  return String(value);
}

function normalizeLesson(lesson) {
  if (!lesson || typeof lesson !== 'object') return null;

  const category =
    lesson.categories && typeof lesson.categories === 'object' && !Array.isArray(lesson.categories)
      ? {
          ...lesson.categories,
          name: normalizeText(lesson.categories.name, 'General'),
          difficulty: normalizeText(lesson.categories.difficulty, ''),
        }
      : null;

  return {
    ...lesson,
    title: normalizeText(lesson.title, 'Untitled lesson'),
    content: normalizeText(lesson.content, ''),
    featured_image: typeof lesson.featured_image === 'string' ? lesson.featured_image : '',
    status: typeof lesson.status === 'string' ? lesson.status : 'draft',
    views_count: Number.isFinite(Number(lesson.views_count)) ? Number(lesson.views_count) : 0,
    created_at: typeof lesson.created_at === 'string' ? lesson.created_at : null,
    updated_at: typeof lesson.updated_at === 'string' ? lesson.updated_at : null,
    code_snippets: Array.isArray(lesson.code_snippets) ? lesson.code_snippets : [],
    categories: category,
  };
}

export async function fetchPublishedLessons() {
  const { data, error } = await supabase
    .from('lessons')
    .select('id, title, content, featured_image, status, views_count, created_at, updated_at, categories(name, difficulty), lesson_tags(tags(name))')
    .eq('status', 'published')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []).map(normalizeLesson).filter(Boolean);
}

export async function fetchLessonById(id) {
  const { data, error } = await supabase
    .from('lessons')
    .select('*, categories(name, difficulty), lesson_tags(tags(name))')
    .eq('id', id)
    .single();

  if (error) throw error;
  return normalizeLesson(data);
}

export async function incrementLessonViews(lessonId) {
  const { error } = await supabase.rpc('increment_lesson_views', {
    lesson_id: lessonId,
  });

  if (error) throw error;
}

export async function fetchAllLessons() {
  const { data, error } = await supabase
    .from('lessons')
    .select('id, title, content, code_snippets, featured_image, category_id, status, views_count, created_at, updated_at, categories(name)')
    .order('updated_at', { ascending: false });

  if (error) throw error;
  return (data ?? []).map(normalizeLesson).filter(Boolean);
}

export async function createLesson(payload) {
  const { data, error } = await supabase.from('lessons').insert(payload).select().single();
  if (error) throw error;
  return data;
}

export async function updateLesson(id, payload) {
  const { data, error } = await supabase
    .from('lessons')
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteLesson(id) {
  const { error } = await supabase.from('lessons').delete().eq('id', id);
  if (error) throw error;
}
