export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black animate-pulse">
      {/* Header Skeleton */}
      <div className="h-48 bg-gray-200 dark:bg-zinc-900 w-full relative">
        <div className="absolute -bottom-10 left-1/2 -translate-x-1/2">
          <div className="w-20 h-20 bg-gray-300 dark:bg-zinc-800 rounded-full border-4 border-white dark:border-black" />
        </div>
      </div>
      
      {/* Info Bar Skeleton */}
      <div className="mt-12 text-center px-4">
        <div className="h-6 bg-gray-200 dark:bg-zinc-900 w-48 mx-auto rounded mb-2" />
        <div className="h-4 bg-gray-200 dark:bg-zinc-900 w-64 mx-auto rounded" />
      </div>

      {/* Search Skeleton */}
      <div className="mt-6 max-w-2xl mx-auto px-4">
        <div className="h-12 bg-gray-200 dark:bg-zinc-900 rounded-xl w-full" />
      </div>

      {/* Categories Skeleton */}
      <div className="mt-6 flex gap-3 overflow-hidden px-4 max-w-2xl mx-auto">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-8 w-24 bg-gray-200 dark:bg-zinc-900 rounded-full flex-shrink-0" />
        ))}
      </div>

      {/* Menu Items Skeleton */}
      <div className="mt-8 max-w-2xl mx-auto px-4 space-y-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="space-y-4">
            <div className="h-6 w-32 bg-gray-200 dark:bg-zinc-900 rounded" />
            <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 flex gap-4">
              <div className="flex-1 space-y-3">
                <div className="h-5 w-3/4 bg-gray-200 dark:bg-zinc-800 rounded" />
                <div className="h-4 w-1/2 bg-gray-200 dark:bg-zinc-800 rounded" />
                <div className="h-4 w-16 bg-gray-200 dark:bg-zinc-800 rounded mt-2" />
              </div>
              <div className="w-24 h-24 bg-gray-200 dark:bg-zinc-800 rounded-xl flex-shrink-0" />
            </div>
            <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 flex gap-4">
              <div className="flex-1 space-y-3">
                <div className="h-5 w-3/4 bg-gray-200 dark:bg-zinc-800 rounded" />
                <div className="h-4 w-1/2 bg-gray-200 dark:bg-zinc-800 rounded" />
                <div className="h-4 w-16 bg-gray-200 dark:bg-zinc-800 rounded mt-2" />
              </div>
              <div className="w-24 h-24 bg-gray-200 dark:bg-zinc-800 rounded-xl flex-shrink-0" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
