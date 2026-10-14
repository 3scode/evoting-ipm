'use client';

export function ErrorToast({ message, onRetry }: { message: string; onRetry?: () => void }) {
  if (!message) return null;
  return (
    <div role="alert" className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700 flex items-center justify-between gap-2">
      <span>{message}</span>
      {onRetry && (
        <button onClick={onRetry} className="rounded border border-red-300 px-2 py-1 text-xs font-bold">
          Retry
        </button>
      )}
    </div>
  );
}
