function ErrorState({ message, onRetry }) {
  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-slate-900">
      <div className="space-y-4">
        <div>
          <p className="text-sm font-semibold text-red-800">Something went wrong.</p>
          <p className="mt-2 text-sm text-red-700">{message}</p>
        </div>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
          >
            Try again
          </button>
        )}
      </div>
    </div>
  );
}

export default ErrorState;
