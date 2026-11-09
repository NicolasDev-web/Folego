# Coleta e tratamento reprodutível — microtarefas

## 02-01 — Implementar adaptadores SCR/IBGE/MTE

- [ ] Implementar ou produzir a entrega delimitada.
- [ ] Verificar: Downloads com timeout, cache, paginação completa, hashes e competência.
- [ ] Registrar caminho da evidência e atualizar status.

Depende de: entrada da fase.
Evidência parcial: `pipeline/extract/phase00_collect.py`, `municipal_geometries.py`, `municipal_income.py` e `municipal_employment.py` cobrem IBGE e MTE com timeout, validação e hashes. Status: em andamento; adaptador histórico SCR ainda pendente.


## 02-02 — Normalizar campos e unidades por versão

- [ ] Implementar ou produzir a entrega delimitada.
- [ ] Verificar: Money, datas e códigos normalizados; mudança de schema causa erro legível.
- [ ] Registrar caminho da evidência e atualizar status.

Depende de: 02-01.
Evidência parcial: `municipal_income.py` e `municipal_employment.py` normalizam valores, períodos e códigos e falham em leiaute inesperado. Status: em andamento; normalização SCR pendente.


## 02-03 — Separar fatos e construir dimensões

- [ ] Implementar ou produzir a entrega delimitada.
- [ ] Verificar: Nenhum total/subtotal duplicado; UF, município e sub-região permanecem distintos.
- [ ] Registrar caminho da evidência e atualizar status.

Depende de: 02-02.
Evidência parcial: `data/processed/municipal_context.json` mantém a dimensão municipal por código IBGE; os arquivos `municipal_income_2022.csv` e `municipal_employment_2026-09.csv` contêm fatos separados, sem totais duplicados. Status: em andamento.


## 02-04 — Ingerir pesquisas e registrar extrações

- [ ] Implementar ou produzir a entrega delimitada.
- [ ] Verificar: Tabelas estruturadas ou conferência de publicação; denominador e cobertura documentados.
- [ ] Registrar caminho da evidência e atualizar status.

Depende de: 02-03.
Evidência parcial: o microdado `CAGEDMOV202609` foi agregado para 184 municípios e conferido contra a divulgação oficial; URL, hash, regra e revisão estão em `metadata/municipal_employment_manifest.json`. Status: em andamento; pesquisas de crédito permanecem pendentes.


## 02-05 — Implementar indicadores prioritários

- [ ] Implementar ou produzir a entrega delimitada.
- [ ] Verificar: Fórmulas de INDICADORES com casos de ponderação, null e denominador zero.
- [ ] Registrar caminho da evidência e atualizar status.

Depende de: 02-04.
Evidência: a preencher pelo executor. Status inicial: não iniciada.


## 02-06 — Exportar agregados e relatório de qualidade

- [ ] Implementar ou produzir a entrega delimitada.
- [ ] Verificar: Observações respeitam contrato e matriz de cobertura; execução repetida é estável.
- [ ] Registrar caminho da evidência e atualizar status.

Depende de: 02-05.
Evidência: a preencher pelo executor. Status inicial: não iniciada.
