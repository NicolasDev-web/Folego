# Coleta e tratamento reprodutível — microtarefas

## 02-01 — Implementar adaptadores SCR/IBGE/MTE

- [x] Implementar ou produzir a entrega delimitada.
- [x] Verificar: Downloads com timeout, cache, paginação completa, hashes e competência.
- [x] Registrar caminho da evidência e atualizar status.

Depende de: entrada da fase.
Evidência: `pipeline/extract/http_client.py`, `pipeline/extract/bcb_adapter.py`, `pipeline/extract/ibge_adapter.py`, `pipeline/extract/mte_caged_adapter.py`, `pipeline/extract/municipal_income.py`, `pipeline/extract/municipal_employment.py`, `metadata/phase02_manifest.json` e `metadata/scr_data_monthly_hashes.json`. Status: concluída em 09/11/2026.


## 02-02 — Normalizar campos e unidades por versão

- [x] Implementar ou produzir a entrega delimitada.
- [x] Verificar: Money, datas e códigos normalizados; mudança de schema causa erro legível.
- [x] Registrar caminho da evidência e atualizar status.

Depende de: 02-01.
Evidência: `pipeline/transform/normalize.py` e `pipeline/tests/test_phase02.py` (validação de `SchemaNormalizationError` para mudança de colunas, códigos IBGE de 6/7 dígitos, deflação por IPCA `1737` a preços de `2026-09` e transição metodológica `sdd-scr-v2-pre2025` / `sdd-scr-v2-pos2025`). Status: concluída em 09/11/2026.


## 02-03 — Separar fatos e construir dimensões

- [x] Implementar ou produzir a entrega delimitada.
- [x] Verificar: Nenhum total/subtotal duplicado; UF, município e sub-região permanecem distintos.
- [x] Registrar caminho da evidência e atualizar status.

Depende de: 02-02.
Evidência: `pipeline/transform/facts.py`, `data/processed/dim_territory.parquet`, `data/processed/dim_indicator.parquet`, `data/processed/fact_scr_macro.parquet`, `data/processed/fact_scr_profiles.parquet`, `data/processed/fact_scr_subregion.parquet`, `data/processed/fact_caged_adjusted.parquet`, `data/processed/fact_surveys.parquet` e `pipeline/tests/test_phase02.py`. Status: concluída em 09/11/2026.


## 02-04 — Ingerir pesquisas e registrar extrações

- [x] Implementar ou produzir a entrega delimitada.
- [x] Verificar: Tabelas estruturadas ou conferência de publicação; denominador e cobertura documentados.
- [x] Registrar caminho da evidência e atualizar status.

Depende de: 02-03.
Evidência: `pipeline/extract/surveys_adapter.py`, `data/raw/surveys/peic_cnc_202610_2026-11-09.xls`, `data/raw/surveys/peic_cnc_202611_2026-11-09.xls`, `data/raw/surveys/ipdc_fecomercio_posts_2026-11-09.json`, `data/raw/surveys/surveys_peic_ipdc_2026-11-09.json` e `metadata/municipal_employment_manifest.json`. Denominadores (`% do total de famílias` vs. `% dos endividados`) e ausência em `2025-11` (`null` / `indisponivel`) preservados. Status: concluída em 09/11/2026.


## 02-05 — Implementar indicadores prioritários

- [x] Implementar ou produzir a entrega delimitada.
- [x] Verificar: Fórmulas de INDICADORES com casos de ponderação, null e denominador zero.
- [x] Registrar caminho da evidência e atualizar status.

Depende de: 02-04.
Evidência: `pipeline/transform/indicators.py` e `pipeline/tests/test_phase02.py` (`compute_inad90_pct`, `compute_weighted_rate_pct`, `compute_saldo_operacao` tratando `numero_de_operacoes = -1` como `suprimido`, `compute_participacao_modalidade_pct`, `compute_vencido15_sub_pct` com status `parcial`). Status: concluída em 09/11/2026.


## 02-06 — Exportar agregados e relatório de qualidade

- [x] Implementar ou produzir a entrega delimitada.
- [x] Verificar: Observações respeitam contrato e matriz de cobertura; execução repetida é estável.
- [x] Registrar caminho da evidência e atualizar status.

Depende de: 02-05.
Evidência: `pipeline/validate/export_public.py`, `pipeline/run_phase02.py`, `app/public/data/state_macro_series.json`, `app/public/data/credit_profiles.json`, `app/public/data/labor_and_surveys.json`, `data/processed/coverage_matrix_full.csv`, `metadata/phase02_manifest.json` e `02_fontes/RELATORIO_QUALIDADE_DADOS.md` (872 observações validadas contra `04_tecnico/CONTRATO_DADOS.json`). Status: concluída em 09/11/2026.
