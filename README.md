# Plataforma Analytics NLQ — SeniorX

Este repositório contém uma plataforma de Analytics com geração de painéis e gráficos via IA, utilizando dados disponíveis no Trino (Iceberg + Nessie) por tenant. A execução local foi simplificada para subir todos os componentes com um único docker-compose na raiz.

## Visão Geral
- Backend FastAPI (Clean Architecture) para NLQ, catálogo, dados de gráficos e regras de negócio.
- Frontend React + Vite para edição e visualização de painéis.
- Trino + Nessie com catálogos Iceberg e um loader que cria esquemas, tabelas e dados de exemplo por tenant.
- Postgres e Redis para persistência e cache do backend.

Estrutura principal do projeto:
- [docker-compose.yml](docker-compose.yml): orquestra todos os serviços.
- [backend-python](backend-python): serviço FastAPI.
- [frontend-react](frontend-react): aplicação web (Vite dev).
- [trino-local](trino-local): Trino + Nessie + loader com SQLs de seed.
- [Architecture_Overview.md](Architecture_Overview.md) e [PRD_Plataforma_Analytics_NLQ.md](PRD_Plataforma_Analytics_NLQ.md): documentos de arquitetura e produto.

## Pré-requisitos
- Docker e docker-compose (v1 ou plugin v2). Valide com:

```bash
docker-compose version
```

- Portas livres no host:
  - Backend: 8081
  - Frontend (Vite): 5500
  - Trino (HTTPS, apenas 127.0.0.1): 8443
  - Nessie: 19120
  - Postgres: 5432
  - Redis: 6379

## Como rodar localmente
1. Do diretório raiz, valide o compose:
```bash
docker-compose config
```
2. Suba todos os serviços (build na primeira vez):
```bash
docker-compose up -d --build
```
3. Acesse:
- Frontend: http://localhost:5500
- Backend (Swagger): http://localhost:8081/docs
- Trino: https://localhost:8443 (autenticação por senha; ver "Segurança do Trino")
- Nessie: http://localhost:19120

4. Catálogo por tenant (mapeado a schemas Iceberg):
```bash
curl -sS http://localhost:8081/api/catalog/empresa1
curl -sS http://localhost:8081/api/catalog/empresa2
curl -sS http://localhost:8081/api/catalog/empresa3
```

Tenants habilitados: empresa1, empresa2, empresa3.

## Serviços e variáveis
- Backend usa catálogo iceberg e mapeia o tenant diretamente para o schema (ex.: empresa1). Principais variáveis já definidas em [docker-compose.yml](docker-compose.yml):
  - TRINO_HOST=trino, TRINO_PORT=8443, TRINO_HTTP_SCHEME=https, TRINO_CATALOG=iceberg
  - TRINO_CA_CERT_PATH=/run/secrets/trino-ca/ca.crt, TRINO_PASSWORDS_DIR=/run/secrets/trino
  - POSTGRES_HOST=postgres, REDIS_URL=redis://redis:6379/0
  - VALID_TENANTS como array JSON: ["empresa1","empresa2","empresa3"]
- Frontend (Vite) roda na porta 5500 e consome o backend em http://localhost:8081.
- Trino armazena dados do Iceberg em /var/trino/iceberg; Nessie provê o catálogo.

## Segurança do Trino
- O Trino exige HTTPS (porta 8443) com autenticação por senha (`password-authenticator.properties`). A porta HTTP 8080 não é publicada e recusa autenticação; a 8443 só é publicada em 127.0.0.1.
- O serviço `trino-secrets` gera, na primeira execução, a CA/certificado TLS, o segredo interno do Trino e uma senha aleatória por usuário, em volumes Docker separados:
  - `trino_server_secrets`: só o Trino (password.db, trino.pem, shared-secret).
  - `trino_loader_secret`: só o loader (usuário `loader`, único com escrita).
  - `trino_backend_secrets`: só o backend (usuários `user_empresa1..3`).
  - `trino_ca`: certificado da CA para os clientes validarem o TLS.
- O backend executa cada consulta autenticado como o usuário Trino do tenant (`user_<tenant>`), que em [rules.json](trino-local/trino/etc/access-control/rules.json) só tem SELECT no próprio schema. Não há usuário `root` e a impersonação é negada.
- Para adicionar um tenant: inclua-o em `TRINO_TENANTS` (serviço `trino-secrets`), em `VALID_TENANTS` (backend) e em rules.json, e rode `docker-compose up -d trino-secrets trino`.
- Para acessar o Trino do host: `docker run --rm -v analytics-nlp_trino_loader_secret:/s alpine cat /s/loader` mostra a senha do loader; use `trino --server https://localhost:8443 --user loader --password` com a CA do volume `trino_ca`.

## Troubleshooting
- Frontend inacessível:
  - Verifique logs: docker-compose logs -f frontend
  - Confirme porta: http://localhost:5500 (configurada em [frontend-react/vite.config.ts](frontend-react/vite.config.ts)).
- Backend demorando para responder:
  - Primeira execução instala dependências. Acompanhe: docker-compose logs -f backend.
  - Teste saúde: curl -sS http://localhost:8081/health.
- Erro ContainerConfig ao recriar serviços (Compose v1):
  - Remova containers antigos e suba novamente:
```bash
docker ps -a --format "table {{.Names}}\t{{.Status}}"
docker rm -f <nome-container-antigo>
docker-compose up -d <serviço>
```
- Loader do Trino falhou com ICEBERG_COMMIT_ERROR:
  - Já ajustado para rodar o processo do Trino como root (uid 0) no container, garantindo escrita em /var/trino/iceberg.
  - Reexecute loader e verifique logs:
```bash
docker-compose up -d loader
docker-compose logs -f loader
```
- Verificar tabelas via backend:
```bash
curl -sS http://localhost:8081/api/catalog/empresa1
```

## Encerrar e limpar
```bash
docker-compose down -v
```

## Desenvolvimento (opcional)
- Backend fora de container:
  - Use Python 3.11+, crie venv e pip install -r em [backend-python](backend-python), execute uvicorn main:app --reload --port 8081.
- Frontend fora de container:
  - Em [frontend-react](frontend-react): npm install && npm run dev -- --host (porta conforme vite.config.ts).

---
Para evoluções (ex.: servir frontend em produção via Nginx), podemos adicionar um serviço frontend-prod no compose e apontar para dist. Solicite se desejar.