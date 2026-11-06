# Viabilidade e prova de cobertura — microtarefas

## 00-01 — Inventariar arquivos e tabelas das fontes centrais

- [x] Implementar ou produzir a entrega delimitada.
- [x] Verificar: Catálogo com URL, licença/termos, unidade, grão, datas e versão por fonte.
- [x] Registrar caminho da evidência e atualizar status.

Depende de: entrada da fase.
Evidência: `02_fontes/CATALOGO.md` e `metadata/phase00_manifest.json`. Status: concluída em 06/11/2026.


## 00-02 — Resolver oficialmente a geografia SUB_REGIAO

- [x] Implementar ou produzir a entrega delimitada.
- [x] Verificar: Tabela oficial de correspondência ou decisão documentada de não usar na escala municipal; códigos não são convertidos por suposição.
- [x] Registrar caminho da evidência e atualizar status.

Depende de: 00-01.
Evidência: `02_fontes/RELATORIO_VIABILIDADE.md`, seção “Decisão geográfica”. Status: concluída em 06/11/2026 com decisão de não usar na escala municipal.


## 00-03 — Verificar fonte direta de dívida municipal

- [x] Implementar ou produzir a entrega delimitada.
- [x] Verificar: Aplicar os seis critérios de VIABILIDADE_MUNICIPAL; registrar cobertura ou indisponibilidade sem inventar taxa.
- [x] Registrar caminho da evidência e atualizar status.

Depende de: 00-02.
Evidência: `02_fontes/RELATORIO_VIABILIDADE.md`, seção “Teste da fonte direta”. Status: concluída em 06/11/2026; fonte direta não demonstrada.


## 00-04 — Validar lista municipal e contexto IBGE/MTE

- [x] Implementar ou produzir a entrega delimitada.
- [x] Verificar: Municípios CE, códigos, tabela de renda/população e fonte de emprego com competências reais.
- [x] Registrar caminho da evidência e atualizar status.

Depende de: 00-03.
Evidência: `data/processed/municipal_context.json`, manifesto da coleta e relatório de viabilidade. Status: concluída em 06/11/2026; renda permanece parcial, como registrado na matriz.


## 00-05 — Montar matriz território × indicador × período

- [x] Implementar ou produzir a entrega delimitada.
- [x] Verificar: Status observado/parcial/suprimido/indisponível; piloto com oito cidades e regra de expansão.
- [x] Registrar caminho da evidência e atualizar status.

Depende de: 00-04.
Evidência: `data/processed/coverage_matrix.csv`. Status: concluída em 06/11/2026; 36 registros para o piloto.


## 00-06 — Escolher escopo municipal A ou B e janela temporal

- [x] Implementar ou produzir a entrega delimitada.
- [x] Verificar: Decisão em relatório de viabilidade com evidências e limitações; MVP permanece executável.
- [x] Registrar caminho da evidência e atualizar status.

Depende de: 00-05.
Evidência: `02_fontes/RELATORIO_VIABILIDADE.md`. Status: concluída em 06/11/2026; opção B e janelas temporais definidas.
