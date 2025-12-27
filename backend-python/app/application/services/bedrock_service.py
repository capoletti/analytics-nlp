"""AWS Bedrock integration for NL dashboard generation"""

import json
import logging
import uuid
from typing import Any, Dict, List, Optional

import boto3
from botocore.config import Config as BotoConfig

from app.config import get_settings
from app.infrastructure.external.trino.client import get_trino_client


logger = logging.getLogger(__name__)


class BedrockService:
    """Service to generate dashboard configs from natural language via Bedrock"""

    def __init__(self) -> None:
        self.settings = get_settings()
        self._client = None
        self._trino_client = None
        self._init_trino_client()

    @property
    def client(self):
        if self._client:
            return self._client

        if not self.settings.AWS_BEDROCK_ACCESS_KEY_ID or not self.settings.AWS_BEDROCK_SECRET_ACCESS_KEY:
            raise RuntimeError("AWS Bedrock credentials are not configured")

        self._client = boto3.client(
            "bedrock-runtime",
            region_name=self.settings.AWS_BEDROCK_REGION,
            aws_access_key_id=self.settings.AWS_BEDROCK_ACCESS_KEY_ID,
            aws_secret_access_key=self.settings.AWS_BEDROCK_SECRET_ACCESS_KEY,
            config=BotoConfig(retries={"max_attempts": 3, "mode": "standard"}),
        )
        return self._client

    def _init_trino_client(self) -> None:
        """Initialize Trino client used to ground LLM answers."""
        if self._trino_client:
            return
        try:
            self._trino_client = get_trino_client()
        except Exception as exc:  # noqa: BLE001
            logger.warning(
                "Trino client unavailable; IA dashboards will not be grounded on allowed tables: %s",
                exc,
                exc_info=True,
            )
            self._trino_client = None

    def _get_trino_metadata(self, tenant: str) -> List[Dict[str, Any]]:
        """Collect allowed tables and columns for the tenant schema."""
        if not self._trino_client:
            return []

        try:
            tables = self._trino_client.get_tables(tenant) or []
            selected_tables = tables[: self.settings.LLM_MAX_TABLES_FOR_PROMPT]

            metadata: List[Dict[str, Any]] = []
            for table in selected_tables:
                raw_columns = self._trino_client.get_table_schema(table, tenant) or []
                column_names = [
                    col.get("column_name")
                    for col in raw_columns
                    if isinstance(col, dict) and col.get("column_name")
                ]
                
                # Prioritize important columns (status, valor*, data*) before limiting
                priority_patterns = ["status", "situacao", "valor_", "data_"]
                priority_cols = [c for c in column_names if any(p in c.lower() for p in priority_patterns)]
                other_cols = [c for c in column_names if c not in priority_cols]
                sorted_columns = priority_cols + other_cols
                
                metadata.append(
                    {
                        "table": table,
                        "columns": sorted_columns[: self.settings.LLM_MAX_COLUMNS_FOR_PROMPT],
                    }
                )

            return metadata
        except Exception as exc:  # noqa: BLE001
            logger.warning(
                "Failed to fetch Trino metadata for tenant %s: %s", tenant, exc, exc_info=True
            )
            return []

    def _render_trino_context(self, tenant: str, metadata: List[Dict[str, Any]]) -> str:
        if not metadata:
            return (
                f"Tenant/schema: {tenant}. No table metadata available. "
                "If you propose SQL, avoid inventing schemas or tables."
            )

        parts = []
        for item in metadata:
            cols = item.get("columns") or []
            cols_str = ", ".join(cols) if cols else "columns not listed"
            parts.append(f"{item['table']} (columns: {cols_str})")

        tables_summary = "; ".join(parts)
        return (
            f"Tenant/schema: {tenant}. Accessible tables (use ONLY these): {tables_summary}. "
            "Do not invent table names."
        )

    def _find_table(self, metadata: List[Dict[str, Any]], name_contains: List[str]) -> Optional[str]:
        targets = [s.lower() for s in name_contains]
        for item in metadata:
            t = (item.get("table") or "").lower()
            if any(x in t for x in targets):
                logger.info(f"Found table {item.get('table')} matching {targets}")
                return item.get("table")
        logger.info(f"No table found matching {targets} in {[item.get('table') for item in metadata]}")
        return None

    def _business_relation_context(self, tenant: str, metadata: List[Dict[str, Any]], user_prompt: str) -> str:
        p = (user_prompt or "").lower()
        # Heuristic: if user talks about pedidos/vendas, suggest using pedidos_venda and optional notes join
        if ("pedido" in p) or ("venda" in p):
            pedidos_tbl = self._find_table(metadata, ["pedidos_venda", "pedidos"])
            nf_tbl = self._find_table(metadata, ["nota_fiscal", "fat_nota_fiscal", "faturamento"])  # optional

            # Detect common keys to hint joins
            def cols_of(tbl: Optional[str]) -> List[str]:
                for item in metadata:
                    if item.get("table") == tbl:
                        return item.get("columns") or []
                return []

            pedidos_cols = cols_of(pedidos_tbl)
            nf_cols = cols_of(nf_tbl)
            possible_keys = ["cod_empresa", "cod_filial", "id_pedido", "id_cliente"]
            join_keys = [k for k in possible_keys if (k in pedidos_cols and k in nf_cols)]

            if pedidos_tbl:
                base = (
                    f"For sales/order analysis, use {tenant}.{pedidos_tbl} as the primary table. "
                    "Prefer single-table charts when possible by setting config.table to that table. "
                )
                if nf_tbl:
                    if join_keys:
                        base += (
                            f"If you need invoicing relations, you may JOIN {tenant}.{nf_tbl} ON "
                            + " AND ".join([f"{tenant}.{pedidos_tbl}.{k} = {tenant}.{nf_tbl}.{k}" for k in join_keys])
                            + ". "
                        )
                    else:
                        base += (
                            f"If needed, JOIN {tenant}.{nf_tbl} using shared business keys (empresa, filial, pedido), "
                            "and only use columns listed. "
                        )
                base += "Always prefix tables with the tenant schema and only use listed tables/columns."
                return base
        return ""

    def generate_dashboard(self, prompt: str, tenant: str) -> Dict[str, Any]:
        """Generate a dashboard definition from natural language"""
        trino_metadata = self._get_trino_metadata(tenant)
        context_text = self._render_trino_context(tenant, trino_metadata)
        relation_text = self._business_relation_context(tenant, trino_metadata, prompt)

        system_prompt = (
            "You are a senior analytics engineer. Return ONLY compact JSON describing a dashboard. "
            "Use this schema: {\"name\": string, \"description\": string, \"elements\": [" 
            "{\"id\": string, \"name\": string, \"type\": \"chart|table|kpi\", "
            "\"sql\": string|null, \"config\": {\"type\": one of bar,line,area,pie,table,kpi, "
            "\"table\": string|null, \"xAxis\": string|null, \"yAxis\": [string], \"dimensions\": [string], "
            "\"metrics\": [{\"column\": string, \"aggregation\": \"sum|count|avg|min|max\"}]}}]}. "
            "IMPORTANT: If the user requests multiple subjects/entities (e.g., 'contas a pagar e receber'), "
            "create MULTIPLE elements, one for each subject using the appropriate table. "
            "Apply any requested grouping to the xAxis (e.g., 'agrupado por status' means xAxis: 'status'). "
            "Prefer table-based charts over raw SQL. Fields must be simple strings. "
            "When tables are provided, choose only from the list and set config.table accordingly."
        )

        body = {
            "anthropic_version": "bedrock-2023-05-31",
            "system": system_prompt,
            "messages": [
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": (
                                f"{context_text} {relation_text} Task: {prompt}. Output JSON only. "
                                "Use only the listed tables and existing columns."
                            )
                        }
                    ],
                }
            ],
            "max_tokens": 1200,
            "temperature": 0.2,
        }

        try:
            resp = self.client.invoke_model(
                modelId=self.settings.AWS_BEDROCK_MODEL_ID,
                contentType="application/json",
                accept="application/json",
                body=json.dumps(body),
            )

            payload = json.loads(resp["body"].read())
            text_blocks = payload.get("content") or []
            text = ""
            if text_blocks and isinstance(text_blocks, list):
                first = text_blocks[0]
                text = first.get("text") if isinstance(first, dict) else str(first)

            parsed = json.loads(text) if text else {}
            return self._normalize(parsed, trino_metadata, prompt)
        except Exception as exc:  # noqa: BLE001
            logger.error("Failed to generate dashboard via Bedrock: %s", exc, exc_info=True)
            # If anything fails, return a safe fallback
            return self._fallback(prompt, trino_metadata)

    def _get_business_mapping(self, user_prompt: str, trino_metadata: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Map business terms in prompt to actual tables and return list of entities to create"""
        p = (user_prompt or "").lower()
        entities = []
        
        logger.info(f"Business mapping for prompt: {p[:100]}")
        
        # Detect multiple entity request patterns - handle both full and shortened forms
        has_pagar = ("contas a pagar" in p or "conta a pagar" in p)
        has_receber = ("contas a receber" in p or "conta a receber" in p or (("pagar e receber" in p or "pagar e a receber" in p) and has_pagar))
        
        if has_pagar and has_receber:
            pagar_tbl = self._find_table(trino_metadata, ["contas_pagar", "fin_contas_pagar"])
            receber_tbl = self._find_table(trino_metadata, ["contas_receber", "fin_contas_receber"])
            logger.info(f"Detected multi-entity: pagar_tbl={pagar_tbl}, receber_tbl={receber_tbl}")
            if pagar_tbl:
                entities.append({"name": "Contas a Pagar", "table": pagar_tbl, "type": "contas_pagar"})
            if receber_tbl:
                entities.append({"name": "Contas a Receber", "table": receber_tbl, "type": "contas_receber"})
        elif has_pagar:
            pagar_tbl = self._find_table(trino_metadata, ["contas_pagar", "fin_contas_pagar"])
            if pagar_tbl:
                entities.append({"name": "Contas a Pagar", "table": pagar_tbl, "type": "contas_pagar"})
        elif has_receber:
            receber_tbl = self._find_table(trino_metadata, ["contas_receber", "fin_contas_receber"])
            if receber_tbl:
                entities.append({"name": "Contas a Receber", "table": receber_tbl, "type": "contas_receber"})
        
        # Detect pedidos/vendas
        if "pedido" in p or "venda" in p:
            orders_tbl = self._find_table(trino_metadata, ["pedidos_venda", "pedidos"])
            if orders_tbl:
                entities.append({"name": "Vendas por Pedido", "table": orders_tbl, "type": "pedidos"})
        
        return entities

    def _extract_grouping(self, user_prompt: str) -> str:
        """Extract grouping field from prompt (e.g., 'agrupado por status' → 'status')"""
        p = (user_prompt or "").lower()
        if "agrupado por status" in p or "agrupado pelo status" in p:
            return "status"
        if "agrupado por" in p:
            # Try to extract field name after 'agrupado por'
            import re
            match = re.search(r"agrupado por ([a-z_]+)", p)
            if match:
                return match.group(1)
        return None

    def _normalize(self, data: Dict[str, Any], trino_metadata: List[Dict[str, Any]], user_prompt: str) -> Dict[str, Any]:
        name = data.get("name") or "Dashboard gerado com IA"
        description = data.get("description") or "Dashboard criado a partir de linguagem natural"
        elements = data.get("elements") or []

        allowed_tables = {item.get("table") for item in trino_metadata if item.get("table")}
        fallback_table = next(iter(allowed_tables)) if allowed_tables else None
        wants_orders = ("pedido" in (user_prompt or "").lower() or "venda" in (user_prompt or "").lower())
        orders_tbl = self._find_table(trino_metadata, ["pedidos_venda", "pedidos"]) if wants_orders else None
        
        # Business mapping for multi-entity requests
        business_entities = self._get_business_mapping(user_prompt, trino_metadata)
        grouping_field = self._extract_grouping(user_prompt)

        normalized: List[Dict[str, Any]] = []
        for elem in elements:
            if not isinstance(elem, dict):
                continue
            cfg = elem.get("config") or {}

            # Prefer pedidos/venda table when the prompt asks for orders/sales and SQL is not provided
            def cols_for(tbl: Optional[str]) -> List[str]:
                for item in trino_metadata:
                    if item.get("table") == tbl:
                        return item.get("columns") or []
                return []

            if ("pedido" in (user_prompt or "").lower() or "venda" in (user_prompt or "").lower()) and not elem.get("sql"):
                orders_tbl = self._find_table(trino_metadata, ["pedidos_venda", "pedidos"])
                if orders_tbl:
                    cfg["table"] = orders_tbl
                    cols = cols_for(orders_tbl)
                    # Set sensible defaults if missing
                    if not cfg.get("xAxis"):
                        for candidate in ["id_pedido", "data_pedido", "cod_filial"]:
                            if candidate in cols:
                                cfg["xAxis"] = candidate
                                break
                    if not cfg.get("yAxis"):
                        for candidate in ["valor_total", "valor_liquido", "valor_aberto"]:
                            if candidate in cols:
                                cfg["yAxis"] = [candidate]
                                break
                    if not cfg.get("metrics") and cfg.get("yAxis"):
                        cfg["metrics"] = [{"column": cfg["yAxis"][0], "aggregation": "sum"}]

            table_name = cfg.get("table") or cfg.get("source")
            # Hard enforce pedidos table on non-SQL visuals when the intent is orders/sales
            if wants_orders and orders_tbl and not elem.get("sql"):
                table_name = orders_tbl
                cols = []
                for item in trino_metadata:
                    if item.get("table") == orders_tbl:
                        cols = item.get("columns") or []
                        break
                if not cfg.get("xAxis") and cols:
                    for candidate in ["data_emissao", "numero_pedido", "cliente_nome", "filial_nome"]:
                        if candidate in cols:
                            cfg["xAxis"] = candidate
                            break
                if not cfg.get("yAxis") and cols:
                    for candidate in ["valor_liquido_pedido", "valor_liquido_item", "valor_bruto_item"]:
                        if candidate in cols:
                            cfg["yAxis"] = [candidate]
                            break
                if not cfg.get("metrics") and cfg.get("yAxis"):
                    cfg["metrics"] = [{"column": cfg["yAxis"][0], "aggregation": "sum"}]
            if allowed_tables:
                if table_name and table_name not in allowed_tables:
                    # Skip elements pointing to unauthorized tables
                    continue
                if not table_name:
                    table_name = fallback_table

            normalized.append(
                {
                    "id": elem.get("id") or str(uuid.uuid4()),
                    "name": elem.get("name") or (cfg.get("title") or ("Vendas por pedido" if wants_orders else "Visualização")),
                    "type": elem.get("type") or "chart",
                    "sql": elem.get("sql"),
                    "config": {
                        "type": cfg.get("type") or "bar",
                        "table": table_name,
                        "columns": cfg.get("columns"),
                        "dimensions": cfg.get("dimensions"),
                        "metrics": cfg.get("metrics"),
                        "timeField": cfg.get("timeField"),
                        "orderBy": cfg.get("orderBy"),
                        "xAxis": cfg.get("xAxis") or cfg.get("dimension"),
                        "yAxis": cfg.get("yAxis") or cfg.get("metrics"),
                        "aggregation": cfg.get("aggregation"),
                        "filters": cfg.get("filters") or {},
                        "customization": cfg.get("customization"),
                        "position": cfg.get("position") or {"x": 0, "y": len(normalized) * 3, "w": 4, "h": 3},
                    },
                }
            )

        if not normalized:
            normalized = self._fallback_elements(trino_metadata, user_prompt)
        
        logger.info(f"Business entities detected: {len(business_entities)}, normalized: {len(normalized)}")
        
        # If LLM returned only one element but we detected multiple entities, expand
        if business_entities and len(business_entities) > 1 and len(normalized) == 1:
            base_elem = normalized[0]
            normalized = []
            for idx, entity in enumerate(business_entities):
                cols = []
                for item in trino_metadata:
                    if item.get("table") == entity["table"]:
                        cols = item.get("columns") or []
                        break
                
                # Determine appropriate axes
                x_axis = grouping_field if grouping_field and grouping_field in cols else None
                if not x_axis:
                    x_candidates = ["status", "situacao", "data_emissao", "data_vencimento"]
                    x_axis = next((c for c in x_candidates if c in cols), cols[0] if cols else "status")
                
                y_candidates = ["valor_liquido", "valor_aberto", "valor_total", "valor_bruto"]
                y_axis = next((c for c in y_candidates if c in cols), cols[1] if len(cols) > 1 else "valor")
                
                normalized.append({
                    "id": str(uuid.uuid4()),
                    "name": entity["name"],
                    "type": "chart",
                    "sql": None,
                    "config": {
                        "type": base_elem.get("config", {}).get("type") or "bar",
                        "table": entity["table"],
                        "xAxis": x_axis,
                        "yAxis": [y_axis],
                        "metrics": [{"column": y_axis, "aggregation": "sum"}],
                        "dimensions": [x_axis],
                        "position": {"x": 0 if idx == 0 else 6, "y": 0, "w": 6, "h": 4},
                    },
                })

        return {
            "name": name,
            "description": description,
            "elements": normalized,
            "filters": data.get("filters") or {},
        }

    def _fallback_elements(self, trino_metadata: List[Dict[str, Any]], user_prompt: str) -> List[Dict[str, Any]]:
        allowed_tables = [item for item in trino_metadata if item.get("table")]
        wants_orders = ("pedido" in (user_prompt or "").lower() or "venda" in (user_prompt or "").lower())
        # Prefer pedidos/venda table if requested and present
        table_name = (
            next((it["table"] for it in allowed_tables if wants_orders and ("pedidos" in it["table"].lower() or "pedidos_venda" in it["table"].lower())),
                 allowed_tables[0]["table"] if allowed_tables else "sales")
        )
        columns = allowed_tables[0].get("columns") if allowed_tables else []

        # Prefer meaningful business fields for pedidos
        pedidos_like = "pedidos" in (table_name or "").lower()
        if pedidos_like and columns:
            dim_candidates = ["data_emissao", "numero_pedido", "cliente_nome", "filial_nome"]
            met_candidates = ["valor_liquido_pedido", "valor_liquido_item", "valor_bruto_item"]
            dimension = next((c for c in dim_candidates if c in columns), columns[0])
            metric_col = next((c for c in met_candidates if c in columns), columns[1] if len(columns) > 1 else columns[0])
        else:
            dimension = columns[0] if columns else "categoria"
            metric_col = columns[1] if len(columns) > 1 else (columns[0] if columns else "valor")

        return [
            {
                "id": str(uuid.uuid4()),
                "name": "Vendas por categoria",
                "type": "chart",
                "config": {
                    "type": "bar",
                    "table": table_name,
                    "xAxis": dimension,
                    "yAxis": [metric_col],
                    "metrics": [{"column": metric_col, "aggregation": "sum"}],
                    "dimensions": [dimension],
                    "position": {"x": 0, "y": 0, "w": 4, "h": 3},
                },
                "sql": None,
            }
        ]

    def _fallback(self, prompt: str, trino_metadata: List[Dict[str, Any]]) -> Dict[str, Any]:
        # Check if we need multiple entities even in fallback mode
        business_entities = self._get_business_mapping(prompt, trino_metadata)
        grouping_field = self._extract_grouping(prompt)
        
        elements = []
        
        if business_entities and len(business_entities) > 1:
            # Create one element for each business entity
            for idx, entity in enumerate(business_entities):
                cols = []
                for item in trino_metadata:
                    if item.get("table") == entity["table"]:
                        cols = item.get("columns") or []
                        break
                
                logger.info(f"Entity {entity['name']}: found {len(cols)} columns: {cols[:10]}")
                
                # Determine appropriate axes
                x_axis = grouping_field if grouping_field and grouping_field in cols else None
                if not x_axis:
                    x_candidates = ["status", "situacao", "data_emissao", "data_vencimento"]
                    x_axis = next((c for c in x_candidates if c in cols), cols[0] if cols else "status")
                
                y_candidates = ["valor_liquido", "valor_aberto", "valor_total", "valor_bruto"]
                y_axis = next((c for c in y_candidates if c in cols), cols[1] if len(cols) > 1 else "valor")
                
                logger.info(f"Selected axes: x={x_axis}, y={y_axis}")
                
                elements.append({
                    "id": str(uuid.uuid4()),
                    "name": entity["name"],
                    "type": "chart",
                    "sql": None,
                    "config": {
                        "type": "bar",
                        "table": entity["table"],
                        "xAxis": x_axis,
                        "yAxis": [y_axis],
                        "metrics": [{"column": y_axis, "aggregation": "sum"}],
                        "dimensions": [x_axis],
                        "position": {"x": 0 if idx == 0 else 6, "y": 0, "w": 6, "h": 4},
                    },
                })
        else:
            # Single entity fallback
            elements = self._fallback_elements(trino_metadata, prompt)
        
        return {
            "name": "Dashboard IA",
            "description": f"Gerado automaticamente a partir do pedido: {prompt}",
            "elements": elements,
            "filters": {},
        }
