import { useMemo } from 'react';
import type { DashboardData, ChartData } from '@/types/dashboard';
import type { SegmentKey, GroupBy } from '@/types/filters';

export function useSegmentChart(data: DashboardData[], segmentKey: SegmentKey): ChartData {
  return useMemo(() => {
    const map: Record<string, number> = {};
    data.forEach((item) => {
      const key = item[segmentKey];
      map[key] = (map[key] || 0) + (item.valor || 0);
    });

    return {
      labels: Object.keys(map),
      values: Object.values(map),
    };
  }, [data, segmentKey]);
}

export function useRegionChart(data: DashboardData[]): ChartData {
  return useMemo(() => {
    const map: Record<string, number> = {};
    data.forEach((item) => {
      map[item.regiao] = (map[item.regiao] || 0) + (item.valor || 0);
    });

    return {
      labels: Object.keys(map),
      values: Object.values(map),
    };
  }, [data]);
}

export function useTimelineChart(data: DashboardData[], groupBy: GroupBy): ChartData {
  return useMemo(() => {
    const map: Record<string, number> = {};
    data.forEach((item) => {
      const key = groupBy === 'mes' ? item.data.substring(0, 7) : item.data;
      map[key] = (map[key] || 0) + (item.valor || 0);
    });

    const keys = Object.keys(map).sort();
    return {
      labels: keys,
      values: keys.map((k) => map[k]),
    };
  }, [data, groupBy]);
}
