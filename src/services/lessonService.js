import { supabase } from './supabaseClient';

export async function fetchPublishedLessons() {
  const { data, error } = await supabase
    .from('lessons')
    .select('id, title, content, featured_image, status, views_count, created_at, updated_at, categories(name, difficulty), lesson_tags(tags(name))')
    .eq('status', 'published')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function fetchLessonById(id) {
  const { data, error } = await supabase
    .from('lessons')
    .select('*, categories(name, difficulty), lesson_tags(tags(name))')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
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
  return data ?? [];
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
