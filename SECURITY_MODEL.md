# Threat model — capoletti/analytics-nlp (Plataforma Analytics NLQ)

> Derivado do código (sem SECURITY_MODEL.md no repositório) e das respostas do usuário (2026-11-10). Itens marcados *(inferido)* são leitura do código; itens marcados **[usuário]** foram confirmados pelo usuário.

## Visão geral e fronteiras de confiança
Plataforma multi-tenant de dashboards gerados por linguagem natural. O navegador fala com um backend FastAPI; o backend consulta dados por tenant no Trino (Iceberg + Nessie), persiste dashboards no Postgres e chama o AWS Bedrock (Claude) para gerar elementos.

Fronteiras:
1. Navegador ↔ Backend (HTTP, CORS `*` com credenciais — `backend-python/main.py`).
2. Backend ↔ Trino (HTTP sem TLS, sempre como usuário `root` — `app/infrastructure/external/trino/client.py`).
3. Backend ↔ Postgres / Redis (credenciais em env).
4. Backend ↔ AWS Bedrock (chaves AWS em env; prompt do usuário + metadados do tenant enviados ao modelo; saída do modelo volta como config/SQL de gráficos).

## Componentes
| Nome | Código | Notas |
|---|---|---|
| **Frontend** | `frontend-react/` | React + Vite. "Login" só grava o tenant no localStorage / `?tenant=` (`src/contexts/AuthContext.tsx`). |
| **API** | `backend-python/main.py`, `app/presentation/` | Routers `catalog`, `charts`, `dashboard`, `llm`, `health`. |
| **Query Engine** | `app/presentation/routers/charts.py`, `app/infrastructure/external/trino/` | Monta SQL para o Trino a partir da requisição. |
| **LLM Service** | `app/application/services/bedrock_service.py`, `app/presentation/routers/llm.py` | Geração de dashboards via Bedrock. |
| **Dashboard Store** | `app/application/services/dashboard_service.py`, `app/infrastructure/persistence/postgres/`, `app/domain/` | CRUD de dashboards por tenant. |
| **Data Platform** | `trino-local/`, `docker-compose.yml`, `backend-python/docker-compose.yml` | Trino, Nessie, loader, regras de acesso do Trino, Postgres/Redis. |

## Exposição
- **[usuário]** Hoje o sistema roda só em ambiente local/dev (docker-compose), sem exposição de rede. O usuário ainda assim pediu que todos os atacantes sejam considerados (ver abaixo), então a exposição atual não rebaixa achados.

## Pontos de entrada e quem os alcança
Nenhum endpoint exige autenticação *(inferido: não há middleware/dependência de auth; JWT_* em config não é usado)*. Quem alcança a porta 8081 alcança tudo:
- `GET /api/catalog/{tenant}`, `GET /api/catalog/{tenant}/table/{table}` — tenant/tabela interpolados em `SHOW TABLES FROM {schema}` / `DESCRIBE {schema}.{table}`; sem checagem contra `VALID_TENANTS`.
- `GET /api/charts/tables?schema=`, `GET /api/charts/table/{t}/schema?schema=` — qualquer schema.
- `POST /api/charts/data?tenant=` e `/data/preview` — campo `sql` executado literalmente no Trino como `root`; `table` e `tenant` interpolados sem sanitização (`sanitize_identifier` só cobre dimensões/métricas/filtros); `metric.aggregation` interpolado sem allowlist; `filters.logical` também.
- `POST /api/llm/generate-dashboard` — prompt livre + tenant do corpo; saída do LLM pode conter `sql`.
- `/api/dashboards/{tenant}/...` — valida `VALID_TENANTS`, mas não quem é o chamador.
- `/health`, `/info`, `/docs` (Swagger).

## Ativos e sensibilidade
- **[usuário] Ativo mais crítico: isolamento entre tenants.**
- Dados de vendas/financeiro de cada tenant no Iceberg (`empresa1..3`) — alta.
- Isolamento entre tenants — alta.
- Credenciais AWS Bedrock, `JWT_SECRET`, senha Postgres — alta.
- Dashboards salvos (Postgres) — média.
- Disponibilidade do Trino/Bedrock (custo, memória) — média.

## Atacantes
**[usuário] Todos importam** — nenhum perfil descartado:
- Usuário de um tenant tentando ler/alterar dados de outro tenant.
- Anônimo com acesso de rede ao backend.
- Usuário que manipula o LLM via prompt injection para gerar SQL/configs maliciosos.
- Funcionário interno / operador.

## Controles existentes
- `sanitize_identifier` e `format_value` (escape de aspas) em dimensões/métricas/filtros (`charts.py`).
- `_validate_tenant` contra `VALID_TENANTS` no serviço de dashboards; repositório filtra por tenant.
- Regras de acesso do Trino por `user_empresaN` (`trino-local/trino/etc/access-control/rules.json`) — **não efetivas**, pois o backend conecta como `root`.
- Normalização de saída do LLM para tabelas do catálogo (`bedrock_service._normalize`), exceto quando o elemento traz `sql`.

## Fora de escopo / risco aceito
- **[usuário]** Nada: tudo em escopo, incluindo frontend, SQL livre de `/api/charts/data` e configs de `trino-local`/docker-compose.

## Infraestrutura
- **[usuário]** Não há repositório de infraestrutura; o modelo usa apenas `docker-compose.yml` e `trino-local/`.

## Perguntas em aberto
- SQL livre em `/api/charts/data` é um recurso intencional (editor SQL) ou legado?
- Há plano de deploy (gateway/SSO que autentique e injete o tenant)? Mudaria a exposição acima.
