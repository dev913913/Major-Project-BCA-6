function SkeletonGrid({ count = 6, gridClass = 'grid gap-5 md:grid-cols-2 xl:grid-cols-3', itemClass = 'h-80 animate-pulse rounded-2xl bg-slate-100' }) {
  return (
    <div className={gridClass}>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className={itemClass} />
      ))}
    </div>
  );
}

export default SkeletonGrid;