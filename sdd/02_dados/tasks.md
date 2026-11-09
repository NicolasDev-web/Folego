# Coleta e tratamento reprodutível — microtarefas

## 02-01 — Implementar adaptadores SCR/IBGE/MTE

- [ ] Implementar ou produzir a entrega delimitada.
- [ ] Verificar: Downloads com timeout, cache, paginação completa, hashes e competência.
- [ ] Registrar caminho da evidência e atualizar status.

Depende de: entrada da fase.
Evidência parcial: `pipeline/extract/phase00_collect.py` e `pipeline/extract/municipal_geometries.py` cobrem IBGE e a amostra SCR com timeout, validação e hashes. Status: em andamento; adaptador histórico SCR e ingestão MTE ainda pendentes.


## 02-02 — Normalizar campos e unidades por versão

- [ ] Implementar ou produzir a entrega delimitada.
- [ ] Verificar: Money, datas e códigos normalizados; mudança de schema causa erro legível.
- [ ] Registrar caminho da evidência e atualizar status.

Depende de: 02-01.
Evidência parcial: `pipeline/extract/municipal_income.py` normaliza valores monetários, período, códigos e classificações, falhando em schema ou unidade inesperados. Status: em andamento; normalização SCR e MTE pendente.


## 02-03 — Separar fatos e construir dimensões

- [ ] Implementar ou produzir a entrega delimitada.
- [ ] Verificar: Nenhum total/subtotal duplicado; UF, município e sub-região permanecem distintos.
- [ ] Registrar caminho da evidência e atualizar status.

Depende de: 02-02.
Evidência parcial: `data/processed/municipal_context.json` mantém dimensão municipal por código IBGE e `data/processed/municipal_income_2022.csv` contém o fato de renda sem totais duplicados. Status: em andamento.


## 02-04 — Ingerir pesquisas e registrar extrações

- [ ] Implementar ou produzir a entrega delimitada.
- [ ] Verificar: Tabelas estruturadas ou conferência de publicação; denominador e cobertura documentados.
- [ ] Registrar caminho da evidência e atualizar status.

Depende de: 02-03.
Evidência: a preencher pelo executor. Status inicial: não iniciada.


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
