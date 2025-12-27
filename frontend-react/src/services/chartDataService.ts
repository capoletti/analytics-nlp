/**
 * Chart Data API Service
 * Fetches chart data from the backend (Trino via FastAPI)
 */

import { ChartData } from '@/types/chart';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export interface ChartDataRequest {
  table?: string;
  sql?: string;
  limit?: number;
  offset?: number;
  filters?: unknown;
  dimensions?: string[];
  metrics?: Array<{ column: string; aggregation: string }>;
  xAxis?: string;
  yAxis?: string[];
}

export interface ChartDataResponse {
  data: ChartData[];
  total: number;
  limit: number;
  offset: number;
}

export interface TableSchema {
  table: string;
  schema: string;
  columns: Array<{
    column_name: string;
    data_type: string;
    is_nullable: string;
    column_default?: string;
  }>;
}

class ChartDataService {
  /**
   * Get list of available tables
   */
  async getTables(tenant: string, _schema: string = 'default'): Promise<string[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/catalog/${tenant}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch tables: ${response.statusText}`);
      }

      const data = await response.json();
      return data.tables || [];
    } catch (error) {
      console.error('Error fetching tables:', error);
      return [];
    }
  }

  /**
   * Get schema of a table
   */
  async getTableSchema(
    _tenant: string,
    tableName: string,
    schema: string = 'default'
  ): Promise<TableSchema | null> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/charts/table/${tableName}/schema?schema=${schema}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch table schema: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching table schema:', error);
      return null;
    }
  }

  /**
   * Get chart data from table or custom SQL
   */
  async getChartData(
    tenant: string,
    request: ChartDataRequest
  ): Promise<ChartDataResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/charts/data?tenant=${tenant}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          table: request.table,
          sql: request.sql,
          limit: request.limit || 1000,
          offset: request.offset || 0,
          filters: request.filters,
          dimensions: request.dimensions,
          metrics: request.metrics,
          xAxis: request.xAxis,
          yAxis: request.yAxis,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to fetch chart data');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching chart data:', error);
      throw error;
    }
  }

  /**
   * Get preview of chart data (limited rows for quick preview)
   */
  async getChartDataPreview(
    tenant: string,
    request: ChartDataRequest
  ): Promise<ChartDataResponse> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/charts/data/preview?tenant=${tenant}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            table: request.table,
            sql: request.sql,
            limit: request.limit || 100,
            offset: request.offset || 0,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to fetch preview data');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching preview data:', error);
      throw error;
    }
  }
}

export const chartDataService = new ChartDataService();
