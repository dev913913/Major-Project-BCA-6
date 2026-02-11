import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { deleteMedia, fetchMedia, uploadMedia } from '../services/mediaService';

function MediaManagerPage() {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const { user } = useAuth();

  async function loadMedia() {
    const data = await fetchMedia();
    setFiles(data);
  }

  useEffect(() => {
    loadMedia();
  }, []);

  async function handleUpload(event) {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    setUploading(true);
    await uploadMedia(file, user.id);
    setUploading(false);
    await loadMedia();
    event.target.value = '';
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Media Library</h1>

      <label className="inline-flex cursor-pointer items-center rounded bg-indigo-600 px-4 py-2 font-medium text-white">
        <input type="file" className="hidden" onChange={handleUpload} disabled={uploading} />
        {uploading ? 'Uploading...' : 'Upload File'}
      </label>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {files.map((item) => (
          <article key={item.id} className="rounded border border-slate-200 bg-white p-3">
            {item.type.startsWith('image/') ? (
              <img src={item.url} alt={item.filename} className="mb-3 h-36 w-full rounded object-cover" />
            ) : (
              <div className="mb-3 grid h-36 place-items-center rounded bg-slate-100 text-slate-500">File</div>
            )}
            <p className="truncate text-sm font-medium">{item.filename}</p>
            <a href={item.url} target="_blank" rel="noreferrer" className="text-xs text-indigo-600">
              Open
            </a>
            <button
              type="button"
              className="mt-3 block rounded bg-red-100 px-3 py-1 text-xs text-red-700"
              onClick={async () => {
                await deleteMedia(item.id, item.filename);
                await loadMedia();
              }}
            >
              Delete
            </button>
          </article>
        ))}
      </div>
    </div>
  );
}

export default MediaManagerPage;
