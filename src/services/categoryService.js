import { supabase } from './supabaseClient';

export async function fetchCategories() {
  const { data, error } = await supabase
    .from('categories')
    .select('id, name, difficulty, lessons(count)')
    .order('name', { ascending: true });

  if (error) throw error;

  return (data ?? []).map((category) => ({
    ...category,
    lesson_count: category.lessons?.[0]?.count ?? 0,
  }));
}

export async function createCategory(payload) {
  const { data, error } = await supabase.from('categories').insert(payload).select().single();
  if (error) throw error;
  return data;
}

export async function updateCategory(id, payload) {
  const { data, error } = await supabase.from('categories').update(payload).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteCategory(id) {
  const { error } = await supabase.from('categories').delete().eq('id', id);
  if (error) throw error;
}
