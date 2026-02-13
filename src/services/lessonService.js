import { supabase } from './supabaseClient';

export async function fetchPublishedLessons() {
  const { data, error } = await supabase
    .from('lessons')
    .select('id, title, featured_image, status, views_count, created_at, categories(name, difficulty), lesson_tags(tags(name))')
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

export async function incrementLessonViews(id) {
  const { error } = await supabase.from('lesson_views').insert({ lesson_id: id });

  // Keep lesson reading resilient even if tracking write is denied/misconfigured.
  if (error && error.code !== '42501') throw error;
  return !error;
}


export async function fetchAllLessons() {
  const { data, error } = await supabase
    .from('lessons')
    .select('id, title, status, updated_at, categories(name)')
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
