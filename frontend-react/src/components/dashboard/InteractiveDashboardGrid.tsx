import { useState, useCallback, useRef, useEffect } from 'react';
import GridLayout, { Layout } from 'react-grid-layout';
import { ChartConfig } from '@/types/chart';
import { ChartRendererEnhanced } from '@/components/charts/ChartRendererEnhanced';
import { Pencil } from 'lucide-react';
import { Trash2 } from 'lucide-react';
import { IconButton } from '@/components/ui/IconButton';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import { useGlobalFilters } from '@/contexts/GlobalFiltersContext';

// Work around strict type mismatches across react-grid-layout versions
const RGL: any = GridLayout as unknown as any;

interface InteractiveDashboardGridProps {
  charts: ChartConfig[];
  tenant?: string;
  onLayoutChange?: (layout: Layout) => void;
  onDeleteChart?: (chartId: string) => void;
  isEditing?: boolean;
  onEditChart?: (chartId: string) => void;
}

export function InteractiveDashboardGrid({
  charts,
  tenant,
  onLayoutChange,
  onDeleteChart,
  isEditing = false,
  onEditChart,
}: InteractiveDashboardGridProps) {
  const { filters } = useGlobalFilters();
  const [layout, setLayout] = useState<Layout>(
    charts.map((chart) => ({
      i: chart.id,
      x: chart.position?.x || 0,
      y: chart.position?.y || 0,
      w: chart.position?.w || 2,
      h: chart.position?.h || 3,
      static: !isEditing,
    }))
  );
  const [showGrid, setShowGrid] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [history, setHistory] = useState<Layout[]>([]);
  const [redoStack, setRedoStack] = useState<Layout[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number>(1200);
  const [cols] = useState<number>(12);
  const [rowHeight] = useState<number>(120);
  const contentObserversRef = useRef<Map<string, ResizeObserver>>(new Map());
  const [contentHeights, setContentHeights] = useState<Record<string, number>>({});
  // Snap guides removed per revert

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = Math.floor(entry.contentRect.width);
        setContainerWidth(w);
      }
    });
    obs.observe(el);
    setContainerWidth(el.clientWidth);
    return () => obs.disconnect();
  }, []);

  // Keep internal layout in sync when charts or editing mode change
  useEffect(() => {
    const nextLayout = charts.map((chart) => ({
      i: chart.id,
      x: chart.position?.x || 0,
      y: chart.position?.y || 0,
      w: chart.position?.w || 2,
      h: chart.position?.h || 3,
      static: !isEditing,
    }));
    setLayout(nextLayout);
  }, [charts, isEditing]);

  const handleLayoutChange = useCallback(
    (newLayout: Layout) => {
      setHistory((prev) => [...prev.slice(-9), layout]);
      setRedoStack([]);
      setLayout(newLayout);
      onLayoutChange?.(newLayout);
    },
    [layout, onLayoutChange]
  );

  // Removed colWidth (no snap guides overlay)

  // No-op handlers (snap guides removed)
  const onDrag = () => {};
  const onDragStop = () => {};
  const onResize = () => {};
  const onResizeStop = () => {};

  const getChartContentHeight = (chartId: string) => {
    const li = layout.find((i) => i.i === chartId);
    const itemH = li ? li.h * rowHeight : rowHeight * 3;
    const headerH = 48; // approximate header height
    const contentPadding = 8; // reduce extra padding to minimize gap
    return Math.max(160, itemH - headerH - contentPadding);
  };

  // Dynamically measure each card's content area to drive chart height
  const attachContentObserver = useCallback((chartId: string) => {
    return (node: HTMLDivElement | null) => {
      const existing = contentObserversRef.current.get(chartId);
      if (existing) {
        existing.disconnect();
        contentObserversRef.current.delete(chartId);
      }
      if (!node) return;
      const measure = () => {
        const styles = getComputedStyle(node);
        const pt = parseFloat(styles.paddingTop) || 0;
        const pb = parseFloat(styles.paddingBottom) || 0;
        const h = Math.max(160, Math.floor(node.clientHeight - pt - pb));
        setContentHeights((prev) => (prev[chartId] === h ? prev : { ...prev, [chartId]: h }));
      };
      const ro = new ResizeObserver(() => measure());
      ro.observe(node);
      // initial measure
      measure();
      contentObserversRef.current.set(chartId, ro);
    };
  }, []);

  const handleUndo = () => {
    if (history.length === 0) return;
    const prev = history[history.length - 1];
    setHistory(history.slice(0, -1));
    setRedoStack((s) => [...s.slice(-9), layout]);
    setLayout(prev);
    onLayoutChange?.(prev);
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setRedoStack(redoStack.slice(0, -1));
    setHistory((s) => [...s.slice(-9), layout]);
    setLayout(next);
    onLayoutChange?.(next);
  };

  const applySizePreset = (chartId: string, preset: 'S' | 'M' | 'L') => {
    const dims = preset === 'S' ? { w: 3, h: 2 } : preset === 'M' ? { w: 4, h: 3 } : { w: 6, h: 4 };
    const updated = layout.map((item) => (item.i === chartId ? { ...item, ...dims } : item));
    setLayout(updated);
    onLayoutChange?.(updated);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!isEditing || selectedIds.length === 0) return;
    const delta = 1;
    let updated = layout.map((item) => {
      if (!selectedIds.includes(item.i)) return item;
      switch (e.key) {
        case 'ArrowLeft':
          return { ...item, x: Math.max(0, item.x - delta) };
        case 'ArrowRight':
          return { ...item, x: item.x + delta };
        case 'ArrowUp':
          return { ...item, y: Math.max(0, item.y - delta) };
        case 'ArrowDown':
          return { ...item, y: item.y + delta };
        default:
          return item;
      }
    });
    if (updated !== layout) {
      setLayout(updated);
      onLayoutChange?.(updated);
    }
  };

  const toggleSelect = (id: string, e: React.MouseEvent) => {
    if (!isEditing) return;
    if (e.ctrlKey || (e as any).metaKey) {
      setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
    } else {
      setSelectedIds([id]);
    }
  };

  const alignTop = () => {
    const sel = layout.filter((i) => selectedIds.includes(i.i));
    if (sel.length <= 1) return;
    const minY = Math.min(...sel.map((i) => i.y));
    const updated = layout.map((i) => (selectedIds.includes(i.i) ? { ...i, y: minY } : i));
    setLayout(updated);
    onLayoutChange?.(updated);
  };

  const alignLeft = () => {
    const sel = layout.filter((i) => selectedIds.includes(i.i));
    if (sel.length <= 1) return;
    const minX = Math.min(...sel.map((i) => i.x));
    const updated = layout.map((i) => (selectedIds.includes(i.i) ? { ...i, x: minX } : i));
    setLayout(updated);
    onLayoutChange?.(updated);
  };

  const distributeHorizontal = () => {
    const sel = layout.filter((i) => selectedIds.includes(i.i)).sort((a, b) => a.x - b.x);
    if (sel.length <= 2) return;
    const rowY = Math.min(...sel.map((i) => i.y));
    let currentX = 0;
    const updated = layout.map((i) => {
      const idx = sel.findIndex((s) => s.i === i.i);
      if (idx === -1) return i;
      const w = i.w;
      const next = { ...i, x: currentX, y: rowY };
      currentX = Math.min(12, currentX + w);
      return next;
    });
    setLayout(updated);
    onLayoutChange?.(updated);
  };

  const autoArrange = () => {
    // Simple row-wise packing across 12 columns
    let currentX = 0;
    let currentY = 0;
    const updated = layout.map((i) => {
      const w = i.w;
      const h = i.h;
      if (currentX + w > 12) {
        currentX = 0;
        currentY += h;
      }
      const next = { ...i, x: currentX, y: currentY };
      currentX += w;
      return next;
    });
    setLayout(updated);
    onLayoutChange?.(updated);
  };

  return (
    <div
      ref={containerRef}
      className="w-full p-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg"
      tabIndex={0}
      onKeyDown={onKeyDown}
    >
      {isEditing && (
        <div className="mb-4 flex items-center justify-between">
          <div className="rounded-lg bg-blue-50 p-3 text-sm text-blue-700 border border-blue-200">
            💡 <strong>Dica:</strong> Arraste, redimensione, ou use as setas do teclado.
          </div>
          <div className="flex items-center gap-2">
            <button
              className="rounded-md border px-3 py-2 text-sm hover:bg-gray-50"
              onClick={() => setShowGrid((s) => !s)}
            >
              {showGrid ? 'Ocultar grades' : 'Mostrar grades'}
            </button>
            <button
              className="rounded-md border px-3 py-2 text-sm hover:bg-gray-50"
              onClick={handleUndo}
              disabled={history.length === 0}
            >
              Desfazer
            </button>
            <button
              className="rounded-md border px-3 py-2 text-sm hover:bg-gray-50"
              onClick={handleRedo}
              disabled={redoStack.length === 0}
            >
              Refazer
            </button>
            <button
              className="rounded-md border px-3 py-2 text-sm hover:bg-gray-50"
              onClick={autoArrange}
            >
              Auto organizar
            </button>
            {/* (revert) removed grid settings and auto-save controls */}
            {selectedIds.length > 1 && (
              <div className="flex items-center gap-2">
                <button className="rounded-md border px-3 py-2 text-sm hover:bg-gray-50" onClick={alignTop}>Alinhar topo</button>
                <button className="rounded-md border px-3 py-2 text-sm hover:bg-gray-50" onClick={alignLeft}>Alinhar esquerda</button>
                <button className="rounded-md border px-3 py-2 text-sm hover:bg-gray-50" onClick={distributeHorizontal}>Distribuir horizontal</button>
              </div>
            )}
          </div>
        </div>
      )}

      <RGL
        className="w-full"
        layout={layout}
        onLayoutChange={handleLayoutChange}
        cols={cols}
        rowHeight={rowHeight}
        width={containerWidth}
        isDraggable={isEditing}
        isResizable={isEditing}
        compactType="vertical"
        preventCollision={false}
        useCSSTransforms={true}
        containerPadding={[0, 0]}
        margin={[24, 24]}
        draggableHandle=".drag-handle"
        onDrag={onDrag}
        onDragStop={onDragStop}
        onResize={onResize}
        onResizeStop={onResizeStop}
      >
        {charts.map((chart) => (
          <div
            key={chart.id}
            className={`group relative rounded-xl border-2 bg-white shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col ${
              selectedIds.includes(chart.id) ? 'border-primary ring-2 ring-primary/30' : 'border-gray-200'
            }`}
            data-testid={`chart-${chart.id}`}
            style={
              showGrid && isEditing
                ? {
                    backgroundImage:
                      `repeating-linear-gradient(0deg, rgba(0,0,0,0.03), rgba(0,0,0,0.03) 1px, transparent 1px, transparent ${rowHeight}px), ` +
                      `repeating-linear-gradient(90deg, rgba(0,0,0,0.03), rgba(0,0,0,0.03) 1px, transparent 1px, transparent ${Math.max(10, Math.floor(containerWidth / cols))}px)`,
                  }
                : undefined
            }
            
          >
            {/* Header - Drag Handle */}
            <div
              className={`drag-handle flex items-center justify-between border-b border-gray-200 px-4 py-2.5 bg-gradient-to-r from-gray-50 to-white ${
                isEditing
                  ? 'cursor-move hover:from-primary/10 hover:to-white'
                  : ''
              }`}
              onClick={(e) => toggleSelect(chart.id, e)}
            >
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-gray-800">{chart.title}</h3>
                <p className="text-xs text-gray-500 capitalize">{chart.type}</p>
              </div>

              {isEditing && (
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <IconButton
                    ariaLabel="Editar gráfico"
                    variant="outline"
                    size="sm"
                    onClick={() => onEditChart?.(chart.id)}
                  >
                    <Pencil className="h-4 w-4" />
                  </IconButton>
                  <div className="flex items-center gap-1 mr-2">
                    <button
                      className="rounded-md border px-2 py-1 text-xs hover:bg-gray-50"
                      onClick={() => applySizePreset(chart.id, 'S')}
                    >
                      S
                    </button>
                    <button
                      className="rounded-md border px-2 py-1 text-xs hover:bg-gray-50"
                      onClick={() => applySizePreset(chart.id, 'M')}
                    >
                      M
                    </button>
                    <button
                      className="rounded-md border px-2 py-1 text-xs hover:bg-gray-50"
                      onClick={() => applySizePreset(chart.id, 'L')}
                    >
                      L
                    </button>
                  </div>
                  <IconButton
                    ariaLabel="Excluir gráfico"
                    variant="danger"
                    size="sm"
                    onClick={() => onDeleteChart?.(chart.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </IconButton>
                </div>
              )}
            </div>

            {/* Chart Content */}
            <div className="flex-1 overflow-hidden p-3 min-h-0" ref={attachContentObserver(chart.id)}>
              {tenant && chart.sql ? (
                <ChartRendererEnhanced
                  type={chart.type}
                  title={chart.title}
                  height={contentHeights[chart.id] ?? getChartContentHeight(chart.id)}
                  tenant={tenant}
                  sql={chart.sql}
                  customization={chart.customization}
                  filters={filters}
                />
              ) : (
                <div className="flex h-full items-center justify-center text-gray-400">
                  <p className="text-sm">Dados não configurados</p>
                </div>
              )}
            </div>

            {/* Resize Handle - Bottom Right Corner */}
            {isEditing && (
              <div className="absolute bottom-0 right-0 w-6 h-6 bg-gradient-to-tl from-primary to-primary-light opacity-0 group-hover:opacity-100 cursor-nwse-resize transition-opacity rounded-tl" />
            )}
          </div>
        ))}
      </RGL>
      {/* Snap guides overlay removed */}
    </div>
  );
}
