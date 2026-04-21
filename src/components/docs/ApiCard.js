export function ApiCard({ method, path, description, children }) {
  const methodColors = {
    GET: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    POST: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    PUT: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    PATCH: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    DELETE: 'bg-red-500/20 text-red-300 border-red-500/30',
  };

  return (
    <div className="not-prose my-6 overflow-hidden rounded-lg border bg-card">
      <div className="flex items-center gap-3 border-b bg-muted/50 px-4 py-3">
        <span className={`rounded border px-2 py-1 text-xs font-bold ${methodColors[method] || methodColors.GET}`}>
          {method}
        </span>
        <code className="flex-1 text-sm font-mono">{path}</code>
      </div>
      {description && (
        <div className="border-b px-4 py-3 text-sm text-muted-foreground">
          {description}
        </div>
      )}
      {children && (
        <div className="px-4 py-4">
          {children}
        </div>
      )}
    </div>
  );
}
