"""LLM-powered endpoints (Bedrock)"""

import logging
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from app.application.services.bedrock_service import BedrockService
from app.infrastructure.external.trino.client import get_trino_client
from app.presentation.dependencies import get_bedrock_service

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/llm",
    tags=["llm"],
    responses={
        400: {"description": "Bad request"},
        500: {"description": "Internal server error"},
    },
)


class GenerateDashboardRequest(BaseModel):
    prompt: str = Field(..., min_length=4, max_length=2000, description="Natural language intent")
    tenant: str = Field(..., description="Tenant identifier")


class DashboardElementOut(BaseModel):
    id: str
    name: str
    type: str
    config: Dict[str, Any]
    sql: Optional[str] = None


class GenerateDashboardResponse(BaseModel):
    name: str
    description: Optional[str] = None
    elements: List[DashboardElementOut]
    filters: Dict[str, Any] = Field(default_factory=dict)


@router.post("/generate-dashboard", response_model=GenerateDashboardResponse)
def generate_dashboard(
    payload: GenerateDashboardRequest,
    service: BedrockService = Depends(get_bedrock_service),
):
    try:
        result = service.generate_dashboard(payload.prompt, payload.tenant)

        # Enforce business relation: use pedidos_venda table when prompt suggests orders/sales
        wants_orders = ("pedido" in payload.prompt.lower() or "venda" in payload.prompt.lower())
        if wants_orders:
            try:
                trino_client = get_trino_client()
                tables = trino_client.get_tables(payload.tenant) or []
                pedidos_tbl = None
                for t in tables:
                    tl = (t or "").lower()
                    if "pedidos_venda" in tl or "pedidos" in tl:
                        pedidos_tbl = t
                        break
                if pedidos_tbl:
                    # fetch columns for sensible defaults
                    cols_info = trino_client.get_table_schema(pedidos_tbl, payload.tenant)
                    cols = [c.get("column_name") for c in cols_info if isinstance(c, dict) and c.get("column_name")]
                    dim_candidates = ["data_emissao", "numero_pedido", "cliente_nome", "filial_nome"]
                    met_candidates = ["valor_liquido_pedido", "valor_liquido_item", "valor_bruto_item"]
                    def pick(cands):
                        for c in cands:
                            if c in cols:
                                return c
                        return cols[0] if cols else None

                    for elem in result.get("elements", []):
                        if isinstance(elem, dict) and not elem.get("sql"):
                            cfg = elem.get("config") or {}
                            cfg["table"] = pedidos_tbl
                            if not cfg.get("xAxis"):
                                chosen = pick(dim_candidates)
                                if chosen:
                                    cfg["xAxis"] = chosen
                            if not cfg.get("yAxis"):
                                chosen = pick(met_candidates)
                                if chosen:
                                    cfg["yAxis"] = [chosen]
                            if not cfg.get("metrics") and cfg.get("yAxis"):
                                cfg["metrics"] = [{"column": cfg["yAxis"][0], "aggregation": "sum"}]
                            elem["config"] = cfg
            except Exception:
                # best-effort; ignore errors
                pass

        return GenerateDashboardResponse(**result)
    except RuntimeError as e:
        logger.error(f"Bedrock not configured: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        logger.error(f"Error generating dashboard via LLM: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to generate dashboard")
