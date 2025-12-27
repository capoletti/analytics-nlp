# Arquitetura da Solução — Plataforma de Visualização com Geração por Linguagem Natural

## Visão Geral
A plataforma habilita criação, edição e visualização de dashboards analíticos a partir de pedidos em linguagem natural (NL), garantindo isolamento por tenant, grounding em catálogo de dados próprio (Trino) e aplicação de regras de negócio (vendas/pedidos, financeiro/contas).

## Contexto e Tenancy
- Multi-tenant lógico: todas as operações exigem identificação de tenant e restringem acesso a suas fontes de dados.
- Catálogo por tenant: lista de tabelas e colunas permitidas alimenta a geração, normalização e consulta de dados.
- Isolamento e governança: consultas e objetos (dashboards, gráficos) são segregados por tenant.

## Componentes Principais (Backend)
- Serviço de Geração Semântica (NLQ):
  - Interpreta prompt, injeta contexto de tabelas/colunas do tenant e aplica regras de negócio.
  - Suporta múltiplas entidades (ex.: "contas a pagar e receber") produzindo vários elementos.
  - Fallback: quando a geração externa falha, cria elementos consistentes a partir do catálogo e heurísticas (status, valores, datas).
- Serviço de Catálogo:
  - Expõe lista de tabelas disponíveis e seus campos para o tenant.
  - Base para grounding e validação de segurança.
- Serviço de Consulta de Dados para Gráficos:
  - Recebe dimensões (agrupamentos) e métricas (agregações) definidas no gráfico.
  - Constrói consultas agregadas e retorna datasets prontos para visualização.
  - Suporta filtros quando a origem é uma tabela do tenant.
- Serviço de Dashboards:
  - Criação, listagem e recuperação de dashboards com elementos e configurações persistidas.
  - Mantém o layout (posição/tamanho) e metadados do painel.

## Componentes Principais (Frontend)
- Visualização de Painéis:
  - Página de detalhe do dashboard exibe uma grade de cartões de gráfico.
  - Cada cartão renderiza o gráfico conforme tipo, eixos (X/Y), dimensões e métricas.
  - Carregamento de dados via serviço de dados com suporte a agregações.
- Editor de Gráficos:
  - UI para selecionar fonte (tabela/SQL), eixos, dimensões, métricas e tipo de gráfico.
  - Pré-visualização, validação leve e salvamento da configuração.
- Serviço de Dados (cliente):
  - Chama o backend para obter dados agregados usando dimensões/métricas/eixos configurados.
  - Encapsula detalhes de paginação, limites e filtros.

## Integrações
- Trino (consulta a dados do tenant):
  - Motor de execução das consultas, isolado por schema/catalog do tenant.
  - Consultas agregadas (GROUP BY, funções de soma/média/contagem) conforme configuração do gráfico.
- Serviço de Geração Semântica Externo (NL/GenAI):
  - Utilizado para interpretar prompts e sugerir elementos.
  - Operação resiliente: em caso de falha, plataforma executa fallback local.

## Fluxo de Dados (Fim a Fim)
1. Usuário solicita um painel em NL (ex.: "contas a pagar e receber por status").
2. Geração semântica propõe elementos e aplica regras de negócio (múltiplas entidades, eixos por status, métricas financeiras).
3. Normalização garante uso apenas de tabelas do catálogo do tenant; elementos são persistidos como dashboard.
4. Visualização: o cliente solicita dados do gráfico (dimensões/métricas/eixos); o backend gera a consulta agregada e retorna o dataset.
5. Edição: usuário ajusta dimensões/métricas/tipo, salva; visualização reflete nova configuração.

## Regras de Negócio (Domínios)
- Vendas/Pedidos:
  - Priorizar fonte de pedidos de venda do tenant.
  - Dimensões típicas: data de emissão, número do pedido, cliente, filial.
  - Métricas: valores líquidos/brutos por pedido/itens; somatórios por período ou categoria.
- Financeiro:
  - Contas a pagar e a receber mapeadas para suas fontes no tenant.
  - Agrupamento por status; métricas: valores abertos e líquidos agregados.

## Segurança e Governança
- Restrição a fontes autorizadas por tenant; consultas sempre qualificadas pelo espaço do tenant.
- Validação e sanitização de parâmetros (campos, operadores, agregações) para evitar injeções e erros.
- Regras de negócio aplicadas para impedir uso de tabelas indevidas mesmo quando sugeridas pela geração.

## Observabilidade e Operações
- Logs de decisões semânticas (entidades detectadas, seleção de colunas prioritárias).
- Auditoria de consultas agregadas (dimensões, métricas, limites) e tempos de resposta.
- Alertas para falhas de integração externa e ativação de fallback.

## Performance e Escalabilidade
- Consultas agregadas com LIMIT e seleção de campos relevantes minimizam transferência e processamento.
- Arquitetura stateless para escalar serviços de consulta e geração.
- Cache e paginação opcionais para visualizações com grandes volumes.

## Confiabilidade e Fallback
- Quando a geração externa falha, a plataforma cria elementos válidos com base em catálogo e heurísticas de domínio.
- Guard rails: limites de linhas, timeouts e mensagens de erro claras.

## Extensibilidade
- Novos domínios podem ser adicionados definindo regras (tabelas preferidas, dimensões, métricas).
- Suporte a novos tipos de gráficos e interações (drill, cross-filter) via evolução da visualização e do serviço de dados.

## Requisitos Não Funcionais (Resumo)
- Multi-tenant e segurança: isolamento, validação e uso restrito ao catálogo.
- Desempenho: consultas agregadas eficientes e resposta rápida.
- Observabilidade: rastreabilidade de decisões e consultas.
- Confiabilidade: fallback e tolerância a falhas externas.

## Roadmap de Evolução
- Editor avançado com sugestões e pré-visualização aprimorada.
- Joins simples entre fontes do mesmo domínio.
- Telemetria de qualidade de geração e melhorias de UX.
- Cross-filtering e drill-down/through entre gráficos do painel.
