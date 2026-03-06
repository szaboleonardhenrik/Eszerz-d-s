export function SkeletonCard() {
  return (
    <div className="bg-gray-200 animate-pulse rounded-xl h-32" />
  );
}

export function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 px-4 py-3">
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-gray-200 animate-pulse rounded w-2/5" />
        <div className="h-3 bg-gray-200 animate-pulse rounded w-1/4" />
      </div>
      <div className="h-5 w-20 bg-gray-200 animate-pulse rounded-full" />
      <div className="hidden sm:block h-3 w-28 bg-gray-200 animate-pulse rounded" />
      <div className="hidden md:block h-3 w-20 bg-gray-200 animate-pulse rounded" />
    </div>
  );
}

export function SkeletonText({ width = "w-full" }: { width?: string }) {
  return (
    <div className={`h-4 bg-gray-200 animate-pulse rounded ${width}`} />
  );
}

export function SkeletonStats() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="rounded-xl p-5 bg-gray-100 animate-pulse">
          <div className="h-3 bg-gray-200 rounded w-2/3 mb-3" />
          <div className="h-8 bg-gray-200 rounded w-1/3" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonTemplateCard() {
  return (
    <div className="bg-white rounded-xl shadow-sm border p-6 animate-pulse">
      <div className="flex items-start justify-between mb-3">
        <div className="h-5 w-16 bg-gray-200 rounded-full" />
        <div className="h-3 w-12 bg-gray-200 rounded" />
      </div>
      <div className="h-5 bg-gray-200 rounded w-3/4 mb-2" />
      <div className="h-3 bg-gray-200 rounded w-full mb-1" />
      <div className="h-3 bg-gray-200 rounded w-2/3 mb-4" />
      <div className="h-9 bg-gray-200 rounded-lg w-full" />
    </div>
  );
}
