import { supabase } from './supabaseClient';

const BUCKET = 'lesson-media';

export async function uploadMedia(file, uploadedBy) {
  const safeName = `${Date.now()}-${file.name.replace(/\s+/g, '-')}`;
  const { error: uploadError } = await supabase.storage.from(BUCKET).upload(safeName, file, { upsert: false });
  if (uploadError) throw uploadError;

  const { data: publicData } = supabase.storage.from(BUCKET).getPublicUrl(safeName);

  const mediaPayload = {
    filename: safeName,
    url: publicData.publicUrl,
    type: file.type,
    uploaded_by: uploadedBy,
  };

  const { data, error } = await supabase.from('media').insert(mediaPayload).select().single();
  if (error) throw error;
  return data;
}

export async function fetchMedia() {
  const { data, error } = await supabase
    .from('media')
    .select('id, filename, url, type, created_at, profiles(name)')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function deleteMedia(id, filename) {
  const { error: storageError } = await supabase.storage.from(BUCKET).remove([filename]);
  if (storageError) throw storageError;

  const { error } = await supabase.from('media').delete().eq('id', id);
  if (error) throw error;
}
