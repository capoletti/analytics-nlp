export interface CatalogTable {
  name: string;
  schema: string;
  catalog: string;
}

export interface CatalogResponse {
  tables: string[];
  schema: string;
}
