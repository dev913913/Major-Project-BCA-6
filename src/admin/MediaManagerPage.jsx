import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { deleteMedia, fetchMedia, uploadMedia } from '../services/mediaService';
import { friendlyErrorMessage, reportError } from '../utils/errorUtils';

function MediaManagerPage() {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const { user } = useAuth();

  async function loadMedia() {
    try {
      const data = await fetchMedia();
      setFiles(data);
    } catch (err) {
      reportError('Media load', err);
      setError(friendlyErrorMessage('Unable to load media files right now. Please try again.'));
    }
  }

  useEffect(() => {
    loadMedia();
  }, []);

  async function handleUpload(event) {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    try {
      setUploading(true);
      setError('');
      setNotice('');
      await uploadMedia(file, user.id);
      setNotice('File uploaded successfully.');
      await loadMedia();
    } catch (err) {
      reportError('Media upload', err);
      setError(friendlyErrorMessage('Unable to upload file right now. Please try again.'));
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  }

  async function handleDelete(item) {
    try {
      setError('');
      setNotice('');
      await deleteMedia(item.id, item.filename);
      setNotice('File deleted successfully.');
      await loadMedia();
    } catch (err) {
      reportError('Media delete', err);
      setError(friendlyErrorMessage('Unable to delete file right now. Please try again.'));
    }
  }

  async function handleCopyUrl(url) {
    try {
      await navigator.clipboard.writeText(url);
      setNotice('File URL copied to clipboard.');
    } catch {
      setNotice('Unable to copy URL. You can open the file and copy from browser.');
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Media Library</h1>
      {error && <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      {notice && <p className="rounded border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{notice}</p>}

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
            <div className="mt-2 flex flex-wrap gap-2">
              <a href={item.url} target="_blank" rel="noreferrer" className="rounded bg-indigo-100 px-2 py-1 text-xs text-indigo-700">Open</a>
              <button type="button" className="rounded bg-slate-100 px-2 py-1 text-xs text-slate-700" onClick={() => handleCopyUrl(item.url)}>Copy URL</button>
              <button type="button" className="rounded bg-red-100 px-2 py-1 text-xs text-red-700" onClick={() => handleDelete(item)}>Delete</button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

export default MediaManagerPage;
