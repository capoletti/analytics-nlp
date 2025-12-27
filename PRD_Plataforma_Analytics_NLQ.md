# PRD — Plataforma de Visualização de Dados com Geração de Dashboards via Linguagem Natural

## Visão Geral
- Criar painéis analíticos por linguagem natural (NL), com dados restritos ao tenant do usuário.
- Plataforma composta por serviços de geração semântica, catálogo de dados do tenant, consulta agregada e visualização/edição de gráficos.
- Objetivo: reduzir drasticamente o esforço para gerar insights, mantendo governança e confiabilidade.

## Objetivos e KPIs
- Tempo médio para criar um painel: 30 min → < 2 min.
- Sucesso: ≥ 80% dos pedidos em NL geram painéis válidos sem edição manual.
- Isolamento: 0% de referências a dados fora do tenant.
- Desempenho: operações críticas respondem em ≤ 2 s para consultas típicas.

## Escopo
- Incluído:
  - Geração de dashboards via NL com grounding em metadados do tenant.
  - Regras de negócio por domínio (vendas/pedidos; financeiro/contas a pagar e receber).
  - Visualização, edição e salvamento de gráficos.
  - Agregações automáticas com dimensões e métricas.
- Excluído (fase atual):
  - Joins complexos dinâmicos entre múltiplas tabelas.
  - Agendamentos e exportações avançadas.
  - Controle de acesso por coluna/célula.

## Personas
- Analista de Negócios: cria painéis para vendas, financeiro, operações.
- Gestor: consulta KPIs, compara e acompanha status.
- Engenheiro de Dados: garante fontes e integrações.

## Casos de Uso
- "Crie um painel com gráficos de contas a pagar e receber agrupado pelo status": dois gráficos, um por entidade, agregados por status.
- "Crie um dashboard de vendas por pedido": gráficos com valores líquidos por data de emissão ou número do pedido.
- Editar e salvar gráficos: ajustar eixos, métricas e tipo, e persistir configurações.
- Aplicar filtros simples: datas, status, unidades; gráficos atualizam dinamicamente.

## Fluxo de Alto Nível
1. Pedido NL → serviço de geração semântica → normalização + regras de negócio → criação do dashboard.
2. Visualização: cliente requisita dados (dimensões/métricas) → serviço de consulta agrega e retorna dataset → visualizador renderiza.
3. Edição: cliente ajusta eixos/dimensões/métricas/tipo → salva → visualização reflete nova configuração.

## Requisitos Funcionais
- Interpretar NL e gerar múltiplos gráficos quando múltiplas entidades forem citadas (ex.: "pagar e receber").
- Mapear "agrupado por ..." para eixo X e/ou dimensão.
- Restringir a dados do tenant conforme catálogo.
- Regras de negócio:
  - Vendas/Pedidos: preferir fonte de pedidos de venda; dimensões como data de emissão e número do pedido; métricas de valores líquidos.
  - Financeiro: mapear "contas a pagar/receber" para suas entidades; agrupar por status; métricas de valores abertos/líquidos.
- Priorizar métricas financeiras (valor líquido, aberto, total, bruto).
- Fallback: gerar elementos válidos quando a geração semântica estiver indisponível.
- Edição e salvamento de gráficos: tipos, eixos, dimensões, métricas, filtros.
- Visualização responsiva com boa legibilidade.

## Requisitos Não Funcionais
- Multi-tenant: isolamento lógico por tenant em todas as operações.
- Segurança: impedir uso de fontes não autorizadas e campos inexistentes; sanitização de parâmetros.
- Desempenho: consultas agregadas com limites padrão; otimização de caminhos comuns.
- Confiabilidade: fallback em falhas de integrações externas; tolerância a erros controlados.
- Observabilidade: registro de decisões (entidades detectadas, colunas priorizadas) e consultas agregadas.

## Serviços da Plataforma (Visão Funcional)
- Geração Semântica (NLQ): interpreta prompts, sugere elementos e aplica regras de negócio e catálogo do tenant.
- Catálogo de Dados: fornece lista de tabelas/colunas disponíveis por tenant.
- Consulta de Dados: recebe dimensões/métricas, constrói consultas agregadas e retorna datasets.
- Dashboards: cria, lista e recupera dashboards; persiste elementos e configurações.

## Visualização e Edição (Experiência do Usuário)
- Visualização:
  - Gráficos de barras, linhas, áreas e tabelas.
  - Definição de eixos, dimensões e métricas.
  - Tooltip, grade e legenda conforme personalização.
- Edição:
  - Selecionar tabela, campos, dimensões, métricas e tipo; pré-visualização.
  - Sugestões quando faltarem eixos/métricas.
- Organização do painel:
  - Grid responsivo; posição e tamanho por elemento.

## Modelo Conceitual de Dados e Agregações
- Dimensões: campos categóricos (status, cliente, filial, datas).
- Métricas: numéricos com agregações (soma, média, contagem, mínimo, máximo).
- Eixos: X (dimensão principal) e Y (uma ou mais métricas).
- Filtros: condicionais simples aplicados quando origem é uma tabela do tenant.

## Domínios e Regras de Negócio
- Vendas/Pedidos:
  - Fonte preferida: pedidos de venda do tenant.
  - Dimensões: data de emissão, número do pedido, cliente, filial.
  - Métricas: valores líquidos e brutos por pedido/itens.
- Financeiro:
  - Contas a pagar/receber nas fontes respectivas do tenant.
  - Agrupamento por status; métricas de valores abertos e líquidos.

## Segurança e Governança
- Isolamento por tenant em todos os serviços.
- Conformidade com catálogo autorizado de dados.
- Validação de parâmetros para evitar injeções.

## Observabilidade e Telemetria
- Monitoramento de consultas agregadas (dimensões, métricas, limites).
- Registro de mapeamento semântico (entidades, métricas selecionadas).
- Alertas de falhas nas integrações e ativação de fallback.

## Roadmap
- Fase 1: Geração NL com fallback e grounding em catálogo 
- Fase 2: Agregações automáticas na consulta de dados 
- Fase 3: Editor avançado com sugestões e pré-visualização
- Fase 4: Joins simples entre fontes do mesmo domínio 
- Fase 5: Telemetria de uso, qualidade de geração e melhorias de UX.

## Critérios de Aceitação
- Caso: "Contas a pagar e receber por status".
  - Dois gráficos de barras; eixo X = status; métricas somadas de valores abertos/líquidos.
  - Visualização funciona sem edição manual adicional.
- Caso: "Vendas por pedido".
  - Gráficos baseados na fonte de pedidos de venda do tenant.
  - Dimensões: data de emissão/número do pedido; métricas: valores líquidos.

## Riscos e Mitigações
- Integração externa indisponível: fallback baseado em catálogo e regras de negócio.
- Heterogeneidade entre tenants: priorizar campos comuns (status, valores, datas) e heurísticas.
- Consultas pesadas: limites padrão, preferir agregações e orientar filtros.

## Exemplos de Comportamento Esperado
- "Contas a pagar e receber por status": dois gráficos agregando soma de valores por status.
- "Vendas por pedido (30 dias)": barras/linhas por data de emissão com soma de valor líquido.

Este PRD descreve a plataforma de visualização com geração por linguagem natural, orientada por catálogo de dados do tenant, regras de negócio e agregações automáticas, sem mencionar diretamente código ou detalhes de implementação específicos.