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

export async function incrementLessonViews(id, currentViews = 0) {
  const rpcPayloads = [{ lesson_id: id }, { id }, { p_lesson_id: id }];

  for (const params of rpcPayloads) {
    const { error } = await supabase.rpc('increment_lesson_views', params);

    if (!error) return true;

    // Function signature not found in schema cache; try alternate arg names.
    if (error.code === 'PGRST202') {
      continue;
    }

    // Don't break lesson rendering if write permission is missing.
    if (error.code === '42501') {
      return false;
    }

    throw error;
  }

  // Fallback path for environments where RPC is not deployed yet.
  const { error } = await supabase
    .from('lessons')
    .update({ views_count: currentViews + 1 })
    .eq('id', id)
    .eq('status', 'published');

  if (!error) return true;

  if (error.code === '42501') return false;
  throw error;
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
