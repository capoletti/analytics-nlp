export function ChartSkeleton({ height = 250 }: { height?: number }) {
  return (
    <div
      className="animate-pulse space-y-4 rounded-lg bg-gray-100 p-4"
      style={{ height: `${height}px` }}
    >
      <div className="space-y-2">
        <div className="h-4 w-1/3 rounded bg-gray-300"></div>
        <div className="h-3 w-1/4 rounded bg-gray-200"></div>
      </div>
      <div className="flex gap-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex-1 rounded bg-gray-300" style={{ height: '100px' }}></div>
        ))}
      </div>
    </div>
  );
}
