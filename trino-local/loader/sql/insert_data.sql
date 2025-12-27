-- INSERT sample data with explicit CAST for type compatibility
-- All numeric literals are cast to BIGINT or DOUBLE to match table definitions

-- ==========================================
-- CONTAS A PAGAR - 100+ rows per tenant
-- ==========================================

-- Empresa 1: 110 rows
INSERT INTO iceberg.empresa1.analytics_erp_fin_contas_pagar (
  id_titulo, cod_empresa, nome_empresa, cod_filial, nome_filial, status,
  data_previsao_pagamento, data_pago, cod_fornecedor, nome_fornecedor,
  numero_titulo, tipo_titulo,
  valor_aberto, valor_juros, valor_multa, valor_correcao, valor_desconto,
  valor_encargos, valor_outros_acrescimos, valor_outros_descontos,
  valor_imposto_renda, valor_cofins, valor_pis, valor_csll, valor_outras_retencoes,
  valor_liquido, usuario_geracao, dt_integrated
)
SELECT 
  CAST(1000 + n AS BIGINT),
  CAST(1 AS BIGINT),
  'Empresa 1',
  CAST(10 + (n % 3) AS BIGINT),
  CASE (n % 3) WHEN 0 THEN 'Filial A' WHEN 1 THEN 'Filial B' ELSE 'Filial C' END,
  CASE (n % 4) WHEN 0 THEN 'ABERTO' WHEN 1 THEN 'PAGO' WHEN 2 THEN 'VENCIDO' ELSE 'CANCELADO' END,
  DATE '2025-01-01' + INTERVAL '1' DAY * n,
  CASE WHEN (n % 4) = 1 THEN DATE '2025-01-01' + INTERVAL '1' DAY * (n + 2) ELSE NULL END,
  CAST(500 + (n % 50) AS BIGINT),
  'Fornecedor ' || CAST((n % 50) AS VARCHAR),
  'TIT-' || LPAD(CAST(n AS VARCHAR), 6, '0'),
  CASE (n % 3) WHEN 0 THEN 'NF' WHEN 1 THEN 'BOLETO' ELSE 'DUP' END,
  CAST((100.0 + (n * 13.5)) AS DOUBLE),
  CAST((n % 10) * 0.5 AS DOUBLE),
  CAST((n % 5) * 2.0 AS DOUBLE),
  CAST(0.0 AS DOUBLE),
  CAST((n % 8) * 1.5 AS DOUBLE),
  CAST(0.0 AS DOUBLE),
  CAST(0.0 AS DOUBLE),
  CAST(0.0 AS DOUBLE),
  CAST((n % 3) * 5.0 AS DOUBLE),
  CAST((n % 3) * 3.0 AS DOUBLE),
  CAST((n % 3) * 1.5 AS DOUBLE),
  CAST((n % 3) * 2.5 AS DOUBLE),
  CAST(0.0 AS DOUBLE),
  CAST((100.0 + (n * 13.5)) AS DOUBLE),
  'user1',
  current_timestamp
FROM UNNEST(SEQUENCE(1, 110)) AS t(n);

-- Empresa 2: 105 rows
INSERT INTO iceberg.empresa2.analytics_erp_fin_contas_pagar (
  id_titulo, cod_empresa, nome_empresa, cod_filial, nome_filial, status,
  data_previsao_pagamento, data_pago, cod_fornecedor, nome_fornecedor,
  numero_titulo, tipo_titulo,
  valor_aberto, valor_juros, valor_multa, valor_correcao, valor_desconto,
  valor_encargos, valor_outros_acrescimos, valor_outros_descontos,
  valor_imposto_renda, valor_cofins, valor_pis, valor_csll, valor_outras_retencoes,
  valor_liquido, usuario_geracao, dt_integrated
)
SELECT 
  CAST(2000 + n AS BIGINT),
  CAST(2 AS BIGINT),
  'Empresa 2',
  CAST(20 + (n % 4) AS BIGINT),
  CASE (n % 4) WHEN 0 THEN 'Filial A' WHEN 1 THEN 'Filial B' WHEN 2 THEN 'Filial C' ELSE 'Filial D' END,
  CASE (n % 4) WHEN 0 THEN 'ABERTO' WHEN 1 THEN 'PAGO' WHEN 2 THEN 'VENCIDO' ELSE 'CANCELADO' END,
  DATE '2025-01-01' + INTERVAL '1' DAY * n,
  CASE WHEN (n % 4) = 1 THEN DATE '2025-01-01' + INTERVAL '1' DAY * (n + 3) ELSE NULL END,
  CAST(600 + (n % 40) AS BIGINT),
  'Fornecedor ' || CAST((n % 40) AS VARCHAR),
  'TIT-' || LPAD(CAST((n + 1000) AS VARCHAR), 6, '0'),
  CASE (n % 3) WHEN 0 THEN 'NF' WHEN 1 THEN 'BOLETO' ELSE 'DUP' END,
  CAST((150.0 + (n * 17.3)) AS DOUBLE),
  CAST((n % 12) * 0.7 AS DOUBLE),
  CAST((n % 6) * 1.8 AS DOUBLE),
  CAST(0.0 AS DOUBLE),
  CAST((n % 9) * 2.0 AS DOUBLE),
  CAST(0.0 AS DOUBLE),
  CAST(0.0 AS DOUBLE),
  CAST(0.0 AS DOUBLE),
  CAST((n % 4) * 4.5 AS DOUBLE),
  CAST((n % 4) * 2.8 AS DOUBLE),
  CAST((n % 4) * 1.2 AS DOUBLE),
  CAST((n % 4) * 2.0 AS DOUBLE),
  CAST(0.0 AS DOUBLE),
  CAST((150.0 + (n * 17.3)) AS DOUBLE),
  'user2',
  current_timestamp
FROM UNNEST(SEQUENCE(1, 105)) AS t(n);

-- Empresa 3: 100 rows
INSERT INTO iceberg.empresa3.analytics_erp_fin_contas_pagar (
  id_titulo, cod_empresa, nome_empresa, cod_filial, nome_filial, status,
  data_previsao_pagamento, data_pago, cod_fornecedor, nome_fornecedor,
  numero_titulo, tipo_titulo,
  valor_aberto, valor_juros, valor_multa, valor_correcao, valor_desconto,
  valor_encargos, valor_outros_acrescimos, valor_outros_descontos,
  valor_imposto_renda, valor_cofins, valor_pis, valor_csll, valor_outras_retencoes,
  valor_liquido, usuario_geracao, dt_integrated
)
SELECT 
  CAST(3000 + n AS BIGINT),
  CAST(3 AS BIGINT),
  'Empresa 3',
  CAST(30 + (n % 5) AS BIGINT),
  CASE (n % 5) WHEN 0 THEN 'Filial A' WHEN 1 THEN 'Filial B' WHEN 2 THEN 'Filial C' WHEN 3 THEN 'Filial D' ELSE 'Filial E' END,
  CASE (n % 4) WHEN 0 THEN 'ABERTO' WHEN 1 THEN 'PAGO' WHEN 2 THEN 'VENCIDO' ELSE 'CANCELADO' END,
  DATE '2025-01-01' + INTERVAL '1' DAY * n,
  CASE WHEN (n % 4) = 1 THEN DATE '2025-01-01' + INTERVAL '1' DAY * (n + 1) ELSE NULL END,
  CAST(700 + (n % 60) AS BIGINT),
  'Fornecedor ' || CAST((n % 60) AS VARCHAR),
  'TIT-' || LPAD(CAST((n + 2000) AS VARCHAR), 6, '0'),
  CASE (n % 3) WHEN 0 THEN 'NF' WHEN 1 THEN 'BOLETO' ELSE 'DUP' END,
  CAST((200.0 + (n * 11.8)) AS DOUBLE),
  CAST((n % 8) * 0.9 AS DOUBLE),
  CAST((n % 7) * 1.5 AS DOUBLE),
  CAST(0.0 AS DOUBLE),
  CAST((n % 10) * 1.2 AS DOUBLE),
  CAST(0.0 AS DOUBLE),
  CAST(0.0 AS DOUBLE),
  CAST(0.0 AS DOUBLE),
  CAST((n % 5) * 3.5 AS DOUBLE),
  CAST((n % 5) * 2.2 AS DOUBLE),
  CAST((n % 5) * 1.0 AS DOUBLE),
  CAST((n % 5) * 1.8 AS DOUBLE),
  CAST(0.0 AS DOUBLE),
  CAST((200.0 + (n * 11.8)) AS DOUBLE),
  'user3',
  current_timestamp
FROM UNNEST(SEQUENCE(1, 100)) AS t(n);

-- ==========================================
-- CONTAS A RECEBER - 100+ rows per tenant
-- ==========================================

-- Empresa 1: 120 rows
INSERT INTO iceberg.empresa1.analytics_erp_fin_contas_receber
SELECT 
  CAST(4000 + n AS BIGINT),
  CAST(1 AS BIGINT),
  'Empresa 1',
  CAST(10 + (n % 3) AS BIGINT),
  CASE (n % 3) WHEN 0 THEN 'Filial A' WHEN 1 THEN 'Filial B' ELSE 'Filial C' END,
  CASE (n % 3) WHEN 0 THEN 'ABERTO' WHEN 1 THEN 'RECEBIDO' ELSE 'VENCIDO' END,
  DATE '2025-01-01' + INTERVAL '1' DAY * n,
  CASE WHEN (n % 3) = 1 THEN DATE '2025-01-01' + INTERVAL '1' DAY * (n + 2) ELSE NULL END,
  CAST(1000 + (n % 80) AS BIGINT),
  'Cliente ' || CAST((n % 80) AS VARCHAR),
  'REC-' || LPAD(CAST(n AS VARCHAR), 6, '0'),
  CASE (n % 3) WHEN 0 THEN 'NF' WHEN 1 THEN 'BOLETO' ELSE 'DUP' END,
  'PORT-' || CAST((n % 5) AS VARCHAR),
  'CART-' || CAST((n % 3) AS VARCHAR),
  CAST((300.0 + (n * 21.5)) AS DOUBLE),
  CAST((n % 8) * 1.2 AS DOUBLE),
  CAST((n % 6) * 2.5 AS DOUBLE),
  CAST(0.0 AS DOUBLE),
  CAST((n % 7) * 3.0 AS DOUBLE),
  CAST(0.0 AS DOUBLE),
  CAST(0.0 AS DOUBLE),
  CAST(0.0 AS DOUBLE),
  CAST((n % 4) * 6.0 AS DOUBLE),
  CAST((n % 4) * 4.0 AS DOUBLE),
  CAST((n % 4) * 2.0 AS DOUBLE),
  CAST((n % 4) * 3.0 AS DOUBLE),
  CAST(0.0 AS DOUBLE),
  CAST((300.0 + (n * 21.5)) AS DOUBLE),
  'user1',
  current_timestamp
FROM UNNEST(SEQUENCE(1, 120)) AS t(n);

-- Empresa 2: 115 rows
INSERT INTO iceberg.empresa2.analytics_erp_fin_contas_receber
SELECT 
  CAST(5000 + n AS BIGINT),
  CAST(2 AS BIGINT),
  'Empresa 2',
  CAST(20 + (n % 4) AS BIGINT),
  CASE (n % 4) WHEN 0 THEN 'Filial A' WHEN 1 THEN 'Filial B' WHEN 2 THEN 'Filial C' ELSE 'Filial D' END,
  CASE (n % 3) WHEN 0 THEN 'ABERTO' WHEN 1 THEN 'RECEBIDO' ELSE 'VENCIDO' END,
  DATE '2025-01-01' + INTERVAL '1' DAY * n,
  CASE WHEN (n % 3) = 1 THEN DATE '2025-01-01' + INTERVAL '1' DAY * (n + 3) ELSE NULL END,
  CAST(2000 + (n % 90) AS BIGINT),
  'Cliente ' || CAST((n % 90) AS VARCHAR),
  'REC-' || LPAD(CAST((n + 5000) AS VARCHAR), 6, '0'),
  CASE (n % 3) WHEN 0 THEN 'NF' WHEN 1 THEN 'BOLETO' ELSE 'DUP' END,
  'PORT-' || CAST((n % 6) AS VARCHAR),
  'CART-' || CAST((n % 4) AS VARCHAR),
  CAST((400.0 + (n * 18.7)) AS DOUBLE),
  CAST((n % 9) * 1.5 AS DOUBLE),
  CAST((n % 7) * 2.2 AS DOUBLE),
  CAST(0.0 AS DOUBLE),
  CAST((n % 8) * 2.8 AS DOUBLE),
  CAST(0.0 AS DOUBLE),
  CAST(0.0 AS DOUBLE),
  CAST(0.0 AS DOUBLE),
  CAST((n % 5) * 5.5 AS DOUBLE),
  CAST((n % 5) * 3.5 AS DOUBLE),
  CAST((n % 5) * 1.8 AS DOUBLE),
  CAST((n % 5) * 2.5 AS DOUBLE),
  CAST(0.0 AS DOUBLE),
  CAST((400.0 + (n * 18.7)) AS DOUBLE),
  'user2',
  current_timestamp
FROM UNNEST(SEQUENCE(1, 115)) AS t(n);

-- Empresa 3: 108 rows
INSERT INTO iceberg.empresa3.analytics_erp_fin_contas_receber
SELECT 
  CAST(6000 + n AS BIGINT),
  CAST(3 AS BIGINT),
  'Empresa 3',
  CAST(30 + (n % 5) AS BIGINT),
  CASE (n % 5) WHEN 0 THEN 'Filial A' WHEN 1 THEN 'Filial B' WHEN 2 THEN 'Filial C' WHEN 3 THEN 'Filial D' ELSE 'Filial E' END,
  CASE (n % 3) WHEN 0 THEN 'ABERTO' WHEN 1 THEN 'RECEBIDO' ELSE 'VENCIDO' END,
  DATE '2025-01-01' + INTERVAL '1' DAY * n,
  CASE WHEN (n % 3) = 1 THEN DATE '2025-01-01' + INTERVAL '1' DAY * (n + 4) ELSE NULL END,
  CAST(3000 + (n % 70) AS BIGINT),
  'Cliente ' || CAST((n % 70) AS VARCHAR),
  'REC-' || LPAD(CAST((n + 6000) AS VARCHAR), 6, '0'),
  CASE (n % 3) WHEN 0 THEN 'NF' WHEN 1 THEN 'BOLETO' ELSE 'DUP' END,
  'PORT-' || CAST((n % 7) AS VARCHAR),
  'CART-' || CAST((n % 5) AS VARCHAR),
  CAST((250.0 + (n * 24.3)) AS DOUBLE),
  CAST((n % 10) * 1.8 AS DOUBLE),
  CAST((n % 8) * 2.0 AS DOUBLE),
  CAST(0.0 AS DOUBLE),
  CAST((n % 9) * 2.5 AS DOUBLE),
  CAST(0.0 AS DOUBLE),
  CAST(0.0 AS DOUBLE),
  CAST(0.0 AS DOUBLE),
  CAST((n % 6) * 4.8 AS DOUBLE),
  CAST((n % 6) * 3.2 AS DOUBLE),
  CAST((n % 6) * 1.5 AS DOUBLE),
  CAST((n % 6) * 2.2 AS DOUBLE),
  CAST(0.0 AS DOUBLE),
  CAST((250.0 + (n * 24.3)) AS DOUBLE),
  'user3',
  current_timestamp
FROM UNNEST(SEQUENCE(1, 108)) AS t(n);

-- ==========================================
-- MOVIMENTOS DE TESOURARIA - 100+ rows per tenant
-- ==========================================

-- Empresa 1: 130 rows
INSERT INTO iceberg.empresa1.analytics_erp_fin_movimentos_tesouraria
SELECT 
  CAST(7000 + n AS BIGINT),
  CAST(1 AS BIGINT),
  'Empresa 1',
  CAST(10 + (n % 3) AS BIGINT),
  CASE (n % 3) WHEN 0 THEN 'Filial A' WHEN 1 THEN 'Filial B' ELSE 'Filial C' END,
  DATE '2025-01-01' + INTERVAL '1' DAY * n,
  CASE (n % 2) WHEN 0 THEN 'ENTRADA' ELSE 'SAIDA' END,
  CAST((CASE (n % 2) WHEN 0 THEN 1.0 ELSE -1.0 END) * (500.0 + (n * 15.5)) AS DOUBLE),
  'CONTA-' || CAST((n % 10) AS VARCHAR),
  'DOC-' || LPAD(CAST(n AS VARCHAR), 8, '0'),
  CASE (n % 4) WHEN 0 THEN 'VENDA' WHEN 1 THEN 'RECEBIMENTO' WHEN 2 THEN 'PAGAMENTO' ELSE 'TRANSFERENCIA' END,
  CASE (n % 2) WHEN 0 THEN 'CORRENTE' ELSE 'POUPANCA' END,
  'user1',
  current_timestamp
FROM UNNEST(SEQUENCE(1, 130)) AS t(n);

-- Empresa 2: 125 rows
INSERT INTO iceberg.empresa2.analytics_erp_fin_movimentos_tesouraria
SELECT 
  CAST(8000 + n AS BIGINT),
  CAST(2 AS BIGINT),
  'Empresa 2',
  CAST(20 + (n % 4) AS BIGINT),
  CASE (n % 4) WHEN 0 THEN 'Filial A' WHEN 1 THEN 'Filial B' WHEN 2 THEN 'Filial C' ELSE 'Filial D' END,
  DATE '2025-01-01' + INTERVAL '1' DAY * n,
  CASE (n % 2) WHEN 0 THEN 'ENTRADA' ELSE 'SAIDA' END,
  CAST((CASE (n % 2) WHEN 0 THEN 1.0 ELSE -1.0 END) * (600.0 + (n * 18.2)) AS DOUBLE),
  'CONTA-' || CAST((n % 12) AS VARCHAR),
  'DOC-' || LPAD(CAST((n + 8000) AS VARCHAR), 8, '0'),
  CASE (n % 4) WHEN 0 THEN 'VENDA' WHEN 1 THEN 'RECEBIMENTO' WHEN 2 THEN 'PAGAMENTO' ELSE 'TRANSFERENCIA' END,
  CASE (n % 2) WHEN 0 THEN 'CORRENTE' ELSE 'POUPANCA' END,
  'user2',
  current_timestamp
FROM UNNEST(SEQUENCE(1, 125)) AS t(n);

-- Empresa 3: 110 rows
INSERT INTO iceberg.empresa3.analytics_erp_fin_movimentos_tesouraria
SELECT 
  CAST(9000 + n AS BIGINT),
  CAST(3 AS BIGINT),
  'Empresa 3',
  CAST(30 + (n % 5) AS BIGINT),
  CASE (n % 5) WHEN 0 THEN 'Filial A' WHEN 1 THEN 'Filial B' WHEN 2 THEN 'Filial C' WHEN 3 THEN 'Filial D' ELSE 'Filial E' END,
  DATE '2025-01-01' + INTERVAL '1' DAY * n,
  CASE (n % 2) WHEN 0 THEN 'ENTRADA' ELSE 'SAIDA' END,
  CAST((CASE (n % 2) WHEN 0 THEN 1.0 ELSE -1.0 END) * (450.0 + (n * 12.8)) AS DOUBLE),
  'CONTA-' || CAST((n % 8) AS VARCHAR),
  'DOC-' || LPAD(CAST((n + 9000) AS VARCHAR), 8, '0'),
  CASE (n % 4) WHEN 0 THEN 'VENDA' WHEN 1 THEN 'RECEBIMENTO' WHEN 2 THEN 'PAGAMENTO' ELSE 'TRANSFERENCIA' END,
  CASE (n % 2) WHEN 0 THEN 'CORRENTE' ELSE 'POUPANCA' END,
  'user3',
  current_timestamp
FROM UNNEST(SEQUENCE(1, 110)) AS t(n);

-- ==========================================
-- PEDIDOS DE VENDA - 100+ rows per tenant
-- ==========================================

-- Empresa 1: 112 rows
INSERT INTO iceberg.empresa1.analytics_erpx_com_ven_pedidos_venda
SELECT 
  'ITEM-' || LPAD(CAST(n AS VARCHAR), 8, '0'),
  'PED-' || LPAD(CAST(n AS VARCHAR), 8, '0'),
  CAST(50000 + n AS BIGINT),
  CASE (n % 4) WHEN 0 THEN 'ABERTO' WHEN 1 THEN 'FATURADO' WHEN 2 THEN 'CANCELADO' ELSE 'BLOQUEADO' END,
  CASE (n % 4) WHEN 0 THEN 'Aberto' WHEN 1 THEN 'Faturado' WHEN 2 THEN 'Cancelado' ELSE 'Bloqueado' END,
  CAST(2025 AS INTEGER),
  CAST(1 + (n % 12) AS INTEGER),
  current_timestamp - INTERVAL '1' DAY * n,
  CAST((CASE (n % 4) WHEN 2 THEN 0.0 ELSE (800.0 + (n * 32.5)) END) AS DOUBLE),
  current_timestamp - INTERVAL '1' DAY * (n - 5),
  current_timestamp - INTERVAL '1' DAY * (n - 3),
  'TPV' || CAST((n % 3) AS VARCHAR),
  'Tipo Pedido ' || CAST((n % 3) AS VARCHAR),
  'CLI-' || LPAD(CAST((n % 60) AS VARCHAR), 6, '0'),
  'Cliente ' || CAST((n % 60) AS VARCHAR),
  LPAD(CAST((10000000000 + n) AS VARCHAR), 14, '0'),
  'REP-' || LPAD(CAST((n % 20) AS VARCHAR), 4, '0'),
  'Representante ' || CAST((n % 20) AS VARCHAR),
  LPAD(CAST((20000000000 + n) AS VARCHAR), 14, '0'),
  'FIL-' || CAST((n % 3) AS VARCHAR),
  'Filial ' || CASE (n % 3) WHEN 0 THEN 'A' WHEN 1 THEN 'B' ELSE 'C' END,
  'PROD-' || LPAD(CAST((n % 40) AS VARCHAR), 6, '0'),
  'Produto ' || CAST((n % 40) AS VARCHAR),
  NULL,
  NULL,
  CAST((CASE (n % 4) WHEN 2 THEN 0.0 ELSE (1.0 + (n % 20)) END) AS DOUBLE),
  CAST((CASE (n % 4) WHEN 2 THEN 0.0 ELSE (800.0 + (n * 32.5)) END) AS DOUBLE),
  CAST((CASE (n % 4) WHEN 2 THEN 0.0 ELSE (800.0 + (n * 32.5)) END) AS DOUBLE),
  current_timestamp
FROM UNNEST(SEQUENCE(1, 112)) AS t(n);

-- Empresa 2: 118 rows
INSERT INTO iceberg.empresa2.analytics_erpx_com_ven_pedidos_venda
SELECT 
  'ITEM-' || LPAD(CAST((n + 10000) AS VARCHAR), 8, '0'),
  'PED-' || LPAD(CAST((n + 10000) AS VARCHAR), 8, '0'),
  CAST(60000 + n AS BIGINT),
  CASE (n % 4) WHEN 0 THEN 'ABERTO' WHEN 1 THEN 'FATURADO' WHEN 2 THEN 'CANCELADO' ELSE 'BLOQUEADO' END,
  CASE (n % 4) WHEN 0 THEN 'Aberto' WHEN 1 THEN 'Faturado' WHEN 2 THEN 'Cancelado' ELSE 'Bloqueado' END,
  CAST(2025 AS INTEGER),
  CAST(1 + (n % 12) AS INTEGER),
  current_timestamp - INTERVAL '1' DAY * n,
  CAST((CASE (n % 4) WHEN 2 THEN 0.0 ELSE (950.0 + (n * 28.7)) END) AS DOUBLE),
  current_timestamp - INTERVAL '1' DAY * (n - 4),
  current_timestamp - INTERVAL '1' DAY * (n - 2),
  'TPV' || CAST((n % 3) AS VARCHAR),
  'Tipo Pedido ' || CAST((n % 3) AS VARCHAR),
  'CLI-' || LPAD(CAST((n % 70) AS VARCHAR), 6, '0'),
  'Cliente ' || CAST((n % 70) AS VARCHAR),
  LPAD(CAST((30000000000 + n) AS VARCHAR), 14, '0'),
  'REP-' || LPAD(CAST((n % 25) AS VARCHAR), 4, '0'),
  'Representante ' || CAST((n % 25) AS VARCHAR),
  LPAD(CAST((40000000000 + n) AS VARCHAR), 14, '0'),
  'FIL-' || CAST((n % 4) AS VARCHAR),
  'Filial ' || CASE (n % 4) WHEN 0 THEN 'A' WHEN 1 THEN 'B' WHEN 2 THEN 'C' ELSE 'D' END,
  'PROD-' || LPAD(CAST((n % 45) AS VARCHAR), 6, '0'),
  'Produto ' || CAST((n % 45) AS VARCHAR),
  NULL,
  NULL,
  CAST((CASE (n % 4) WHEN 2 THEN 0.0 ELSE (1.0 + (n % 25)) END) AS DOUBLE),
  CAST((CASE (n % 4) WHEN 2 THEN 0.0 ELSE (950.0 + (n * 28.7)) END) AS DOUBLE),
  CAST((CASE (n % 4) WHEN 2 THEN 0.0 ELSE (950.0 + (n * 28.7)) END) AS DOUBLE),
  current_timestamp
FROM UNNEST(SEQUENCE(1, 118)) AS t(n);

-- Empresa 1: 105 rows
INSERT INTO iceberg.empresa1.analytics_erpx_com_fat_nota_fiscal_saida (
  nota_saida_id, nota_numero, nota_data_emissao, nota_tipo_codigo, nota_tipo_descricao,
  nota_situacao_codigo, nota_situacao,
  nota_valor_liquido, nota_valor_bruto_produto, nota_valor_bruto_servico, nota_data_saida,
  serie_id, serie_codigo, serie_abreviatura,
  empresa_id, empresa_codigo, empresa_razao_social,
  filial_id, filial_codigo, filial_nome,
  cliente_id, cliente_codigo, cliente_razao_social, cliente_nome_fantasia, cliente_data_cadastro,
  cliente_uf_id, cliente_uf, cliente_regiao,
  item_id, produto_id, servico_id,
  item_quantidade_faturada, item_valor_bruto, item_valor_liquido, item_preco_unitario, item_preco_venda,
  item_valor_frete_destacado, item_valor_frete, item_valor_frete_importacao,
  item_base_comissao, item_percentual_comissao, item_valor_comissao,
  produto_descricao, servico_descricao,
  dt_integrated
)
SELECT 
  'ITEM-' || LPAD(CAST(n AS VARCHAR), 8, '0'),
  CAST(80000 + n AS BIGINT),
  current_timestamp - INTERVAL '1' DAY * n,
  'MOD' || CAST((n % 3) AS VARCHAR),
  'Modelo ' || CAST((n % 3) AS VARCHAR),
  CASE (n % 5) WHEN 0 THEN 'FAT' WHEN 1 THEN 'CAN' WHEN 2 THEN 'DEN' WHEN 3 THEN 'REJ' ELSE 'AUT' END,
  CASE (n % 5) WHEN 0 THEN 'Faturada' WHEN 1 THEN 'Cancelada' WHEN 2 THEN 'Denegada' WHEN 3 THEN 'Rejeitada' ELSE 'Autorizada' END,
  CAST((CASE (n % 5) WHEN 1 THEN 0.0 ELSE (1200.0 + (n * 45.5)) END) AS DOUBLE),
  CAST((CASE (n % 5) WHEN 1 THEN 0.0 ELSE (n % 10) * 15.0 END) AS DOUBLE),
  CAST((CASE (n % 5) WHEN 1 THEN 0.0 ELSE (n % 8) * 25.0 END) AS DOUBLE),
  current_timestamp - INTERVAL '1' DAY * n,
  LPAD(CAST((1000 + (n % 5)) AS VARCHAR), 4, '0'),
  LPAD(CAST((1000 + n) AS VARCHAR), 6, '0'),
  'Serie ' || CAST((n % 5) AS VARCHAR),
  'EMP1',
  CAST(1 AS BIGINT),
  'Empresa 1',
  'FIL-' || CAST((n % 3) AS VARCHAR),
  CAST(10 + (n % 3) AS BIGINT),
  CASE (n % 3) WHEN 0 THEN 'Filial A' WHEN 1 THEN 'Filial B' ELSE 'Filial C' END,
  'CLI-' || LPAD(CAST((n % 80) AS VARCHAR), 6, '0'),
  CAST(20000 + (n % 80) AS BIGINT),
  'Cliente ' || CAST((n % 80) AS VARCHAR),
  'Fantasia ' || CAST((n % 80) AS VARCHAR),
  current_timestamp - INTERVAL '1' DAY * (n % 90),
  'UF' || CAST((n % 5) AS VARCHAR),
  'SP',
  'SUDESTE',
  'ITEM-' || LPAD(CAST(n AS VARCHAR), 8, '0'),
  'PROD-' || LPAD(CAST((n % 40) AS VARCHAR), 6, '0'),
  NULL,
  CAST((CASE (n % 5) WHEN 1 THEN 0.0 ELSE (1.0 + (n % 30)) END) AS DOUBLE),
  CAST((CASE (n % 5) WHEN 1 THEN 0.0 ELSE (1200.0 + (n * 45.5)) END) AS DOUBLE),
  CAST((CASE (n % 5) WHEN 1 THEN 0.0 ELSE (1200.0 + (n * 45.5)) END) AS DOUBLE),
  CAST((CASE (n % 5) WHEN 1 THEN 0.0 ELSE (50.0 + (n * 1.8)) END) AS DOUBLE),
  CAST((CASE (n % 5) WHEN 1 THEN 0.0 ELSE (50.0 + (n * 1.8)) END) AS DOUBLE),
  CAST((CASE (n % 5) WHEN 1 THEN 0.0 ELSE (n % 7) * 8.0 END) AS DOUBLE),
  CAST((CASE (n % 5) WHEN 1 THEN 0.0 ELSE (n % 7) * 8.0 END) AS DOUBLE),
  CAST(0.0 AS DOUBLE),
  CAST((CASE (n % 5) WHEN 1 THEN 0.0 ELSE (n % 20) * 3.0 END) AS DOUBLE),
  CAST((CASE (n % 5) WHEN 1 THEN 0.0 ELSE (n % 20) * 0.5 END) AS DOUBLE),
  CAST((CASE (n % 5) WHEN 1 THEN 0.0 ELSE (n % 20) * 1.5 END) AS DOUBLE),
  'Produto ' || CAST((n % 40) AS VARCHAR),
  'Servico ' || CAST((n % 15) AS VARCHAR),
  current_timestamp
FROM UNNEST(SEQUENCE(1, 105)) AS t(n);

-- Empresa 2: 108 rows
INSERT INTO iceberg.empresa2.analytics_erpx_com_fat_nota_fiscal_saida (
  nota_saida_id, nota_numero, nota_data_emissao, nota_tipo_codigo, nota_tipo_descricao,
  nota_situacao_codigo, nota_situacao,
  nota_valor_liquido, nota_valor_bruto_produto, nota_valor_bruto_servico, nota_data_saida,
  serie_id, serie_codigo, serie_abreviatura,
  empresa_id, empresa_codigo, empresa_razao_social,
  filial_id, filial_codigo, filial_nome,
  cliente_id, cliente_codigo, cliente_razao_social, cliente_nome_fantasia, cliente_data_cadastro,
  cliente_uf_id, cliente_uf, cliente_regiao,
  item_id, produto_id, servico_id,
  item_quantidade_faturada, item_valor_bruto, item_valor_liquido, item_preco_unitario, item_preco_venda,
  item_valor_frete_destacado, item_valor_frete, item_valor_frete_importacao,
  item_base_comissao, item_percentual_comissao, item_valor_comissao,
  produto_descricao, servico_descricao,
  dt_integrated
)
SELECT 
  'ITEM-' || LPAD(CAST((n + 10000) AS VARCHAR), 8, '0'),
  CAST(90000 + n AS BIGINT),
  current_timestamp - INTERVAL '1' DAY * n,
  'MOD' || CAST((n % 3) AS VARCHAR),
  'Modelo ' || CAST((n % 3) AS VARCHAR),
  CASE (n % 5) WHEN 0 THEN 'FAT' WHEN 1 THEN 'CAN' WHEN 2 THEN 'DEN' WHEN 3 THEN 'REJ' ELSE 'AUT' END,
  CASE (n % 5) WHEN 0 THEN 'Faturada' WHEN 1 THEN 'Cancelada' WHEN 2 THEN 'Denegada' WHEN 3 THEN 'Rejeitada' ELSE 'Autorizada' END,
  CAST((CASE (n % 5) WHEN 1 THEN 0.0 ELSE (1400.0 + (n * 38.2)) END) AS DOUBLE),
  CAST((CASE (n % 5) WHEN 1 THEN 0.0 ELSE (n % 11) * 12.0 END) AS DOUBLE),
  CAST((CASE (n % 5) WHEN 1 THEN 0.0 ELSE (n % 9) * 22.0 END) AS DOUBLE),
  current_timestamp - INTERVAL '1' DAY * n,
  LPAD(CAST((2000 + (n % 6)) AS VARCHAR), 4, '0'),
  LPAD(CAST((2000 + n) AS VARCHAR), 6, '0'),
  'Serie ' || CAST((n % 6) AS VARCHAR),
  'EMP2',
  CAST(2 AS BIGINT),
  'Empresa 2',
  'FIL-' || CAST((n % 4) AS VARCHAR),
  CAST(20 + (n % 4) AS BIGINT),
  CASE (n % 4) WHEN 0 THEN 'Filial A' WHEN 1 THEN 'Filial B' WHEN 2 THEN 'Filial C' ELSE 'Filial D' END,
  'CLI-' || LPAD(CAST((n % 90) AS VARCHAR), 6, '0'),
  CAST(30000 + (n % 90) AS BIGINT),
  'Cliente ' || CAST((n % 90) AS VARCHAR),
  'Fantasia ' || CAST((n % 90) AS VARCHAR),
  current_timestamp - INTERVAL '1' DAY * (n % 95),
  'UF' || CAST((n % 6) AS VARCHAR),
  'RJ',
  'SUDESTE',
  'ITEM-' || LPAD(CAST((n + 10000) AS VARCHAR), 8, '0'),
  'PROD-' || LPAD(CAST((n % 45) AS VARCHAR), 6, '0'),
  NULL,
  CAST((CASE (n % 5) WHEN 1 THEN 0.0 ELSE (1.0 + (n % 35)) END) AS DOUBLE),
  CAST((CASE (n % 5) WHEN 1 THEN 0.0 ELSE (1400.0 + (n * 38.2)) END) AS DOUBLE),
  CAST((CASE (n % 5) WHEN 1 THEN 0.0 ELSE (1400.0 + (n * 38.2)) END) AS DOUBLE),
  CAST((CASE (n % 5) WHEN 1 THEN 0.0 ELSE (55.0 + (n * 1.5)) END) AS DOUBLE),
  CAST((CASE (n % 5) WHEN 1 THEN 0.0 ELSE (55.0 + (n * 1.5)) END) AS DOUBLE),
  CAST((CASE (n % 5) WHEN 1 THEN 0.0 ELSE (n % 8) * 7.0 END) AS DOUBLE),
  CAST((CASE (n % 5) WHEN 1 THEN 0.0 ELSE (n % 8) * 7.0 END) AS DOUBLE),
  CAST(0.0 AS DOUBLE),
  CAST((CASE (n % 5) WHEN 1 THEN 0.0 ELSE (n % 22) * 2.8 END) AS DOUBLE),
  CAST((CASE (n % 5) WHEN 1 THEN 0.0 ELSE (n % 22) * 0.6 END) AS DOUBLE),
  CAST((CASE (n % 5) WHEN 1 THEN 0.0 ELSE (n % 22) * 1.1 END) AS DOUBLE),
  'Produto ' || CAST((n % 45) AS VARCHAR),
  'Servico ' || CAST((n % 18) AS VARCHAR),
  current_timestamp
FROM UNNEST(SEQUENCE(1, 108)) AS t(n);
