"""Tests for SQL construction safety in the charts router"""

from unittest.mock import MagicMock, patch

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.exceptions import TrinoException
from app.presentation.routers import charts


@pytest.fixture
def trino():
    client = MagicMock()

    def execute_query(query):
        if query.startswith("SHOW TABLES"):
            return [{"Table": "pedidos_venda"}]
        return [{"count": 0}]

    client.execute_query.side_effect = execute_query
    with patch.object(charts, "get_trino_client", return_value=client):
        yield client


@pytest.fixture
def api():
    app = FastAPI()
    app.include_router(charts.router)
    return TestClient(app)


def _executed(trino):
    return [c.args[0] for c in trino.execute_query.call_args_list]


def _data_queries(trino):
    return [q for q in _executed(trino) if not q.startswith("SHOW TABLES")]


def test_rejects_unknown_tenant(api, trino):
    resp = api.post("/api/charts/data?tenant=empresa9", json={"table": "pedidos_venda"})
    assert resp.status_code == 400
    trino.execute_query.assert_not_called()


def test_rejects_injected_tenant(api, trino):
    resp = api.post(
        "/api/charts/data",
        params={"tenant": "empresa1.x UNION SELECT 1 --"},
        json={"table": "pedidos_venda"},
    )
    assert resp.status_code == 400
    trino.execute_query.assert_not_called()


def test_rejects_injected_table(api, trino):
    resp = api.post(
        "/api/charts/data?tenant=empresa1",
        json={"table": "pedidos_venda UNION ALL SELECT * FROM empresa3.fin_contas_pagar --"},
    )
    assert resp.status_code == 400
    trino.execute_query.assert_not_called()


def test_rejects_table_not_in_tenant_schema(api, trino):
    resp = api.post("/api/charts/data?tenant=empresa1", json={"table": "fin_contas_pagar"})
    assert resp.status_code == 404
    assert _executed(trino) == ['SHOW TABLES FROM "empresa1"']


def test_metadata_failure_is_not_reported_as_missing_table(api, trino):
    trino.execute_query.side_effect = TrinoException(message="boom", query="SHOW TABLES")
    resp = api.post("/api/charts/data?tenant=empresa1", json={"table": "pedidos_venda"})
    assert resp.status_code == 500


def test_rejects_injected_aggregation(api, trino):
    resp = api.post(
        "/api/charts/data?tenant=empresa1",
        json={
            "table": "pedidos_venda",
            "dimensions": ["a"],
            "metrics": [{"column": "b", "aggregation": "COUNT(*) FROM empresa2.pedidos_venda UNION SELECT 1--"}],
        },
    )
    assert resp.status_code == 422
    trino.execute_query.assert_not_called()


def test_rejects_injected_logical(api, trino):
    resp = api.post(
        "/api/charts/data?tenant=empresa1",
        json={
            "table": "pedidos_venda",
            "filters": {"logical": "OR 1=1) UNION SELECT 1 --", "items": [{"field": "a", "op": "eq", "value": 1}]},
        },
    )
    assert resp.status_code == 422
    trino.execute_query.assert_not_called()


def test_valid_aggregated_query(api, trino):
    resp = api.post(
        "/api/charts/data?tenant=empresa1",
        json={
            "table": "pedidos_venda",
            "dimensions": ["regiao"],
            "metrics": [{"column": "valor", "aggregation": "Sum"}],
            "filters": {"logical": "or", "items": [{"field": "status", "op": "eq", "value": "PAGO"}]},
        },
    )
    assert resp.status_code == 200
    query = _data_queries(trino)[0]
    assert query == (
        'SELECT regiao, SUM(valor) as valor FROM "empresa1"."pedidos_venda" '
        "WHERE status = 'PAGO' GROUP BY regiao LIMIT 1000"
    )
