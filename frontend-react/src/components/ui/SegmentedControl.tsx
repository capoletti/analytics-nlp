interface Segment<T extends string> {
  label: string;
  value: T;
  icon?: React.ReactNode;
}

interface SegmentedControlProps<T extends string> {
  segments: Segment<T>[];
  value: T;
  onChange: (v: T) => void;
  className?: string;
}

export function SegmentedControl<T extends string>({ segments, value, onChange, className = '' }: SegmentedControlProps<T>) {
  return (
    <div className={`inline-flex rounded-lg border border-gray-200 bg-white p-1 ${className}`} role="tablist">
      {segments.map(seg => {
        const active = seg.value === value;
        return (
          <button
            key={seg.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(seg.value)}
            className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-sm transition-colors ${
              active ? 'bg-primary text-white shadow-sm' : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            {seg.icon}
            <span>{seg.label}</span>
          </button>
        );
      })}
    </div>
  );
}
