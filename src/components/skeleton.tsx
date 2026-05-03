export function SkeletonRows() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="h-14 animate-pulse rounded-xl bg-stone-100 dark:bg-white/5" />
      ))}
    </div>
  );
}
