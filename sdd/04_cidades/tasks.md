# Explorador municipal — microtarefas

## 04-01 — Carregar geometrias e códigos oficiais

- [x] Implementar ou produzir a entrega delimitada.
- [x] Verificar: Cobertura da lista IBGE conferida; geometria sem correspondência gera alerta.
- [x] Registrar caminho da evidência e atualizar status.

Depende de: entrada da fase.
Evidência: `metadata/municipal_geometry_manifest.json`, 184 geometrias e correspondência integral de geocódigos. Status: concluída em 06/11/2026.


## 04-02 — Implementar mapa e legenda acessível

- [x] Implementar ou produzir a entrega delimitada.
- [x] Verificar: Escala e ausência distintas; seleção sincronizada com lista/tabela.
- [x] Registrar caminho da evidência e atualizar status.

Depende de: 04-01.
Evidência: `app/src/components/MunicipalityMap.tsx`, testes de projeção e capturas em `evidencias/qa/`. O modo territorial permanece padrão e oferece zoom por 18 regiões; emprego, renda e população são modos opcionais com legendas e limites próprios. Status: ampliada e verificada em 09/11/2026.


## 04-03 — Construir ficha municipal

- [x] Implementar ou produzir a entrega delimitada.
- [x] Verificar: Competência e fonte em cada bloco; contexto regional separado da observação municipal.
- [x] Registrar caminho da evidência e atualizar status.

Depende de: 04-02.
Evidência: `app/src/components/CoveragePanel.tsx`, população municipal observada em 2022 e dívida municipal explicitamente indisponível. Nenhum valor regional é atribuído à cidade. Status: concluída em 06/11/2026.


## 04-04 — Construir comparação de até três cidades

- [x] Implementar ou produzir a entrega delimitada.
- [x] Verificar: Indicador/período/universo compatíveis; filtro impossível explicado.
- [x] Registrar caminho da evidência e atualizar status.

Depende de: 04-03.
Evidência: `app/src/components/MunicipalComparisonSection.tsx`, `app/src/lib/municipalComparisonAndRanking.ts` e `app/src/lib/municipalComparisonAndRanking.test.ts`. Limite estrito de até 3 municípios sincronizado via URL (`?comparar=`), botões rápidos para as 8 cidades-piloto, preservação de `null` sem coerção para zero e linha explícita de indisponibilidade metodológica para `Dívida e inadimplência municipal direta`. Status: concluída em 09/11/2026.


## 04-05 — Implementar ranking apenas para medidas elegíveis

- [x] Implementar ou produzir a entrega delimitada.
- [x] Verificar: Ordenação trata empate/null; número de municípios excluídos visível.
- [x] Registrar caminho da evidência e atualizar status.

Depende de: 04-04.
Evidência: `app/src/components/MunicipalRankingSection.tsx`, `app/src/lib/municipalComparisonAndRanking.ts` e `app/src/lib/municipalComparisonAndRanking.test.ts`. Ordenação habilitada exclusivamente para as 5 medidas municipais observadas, com posição competitiva idêntica em empates (`=º`), separação explícita dos municípios com valor `null` (como os 7 municípios sem admissões com salário positivo em `2026-09`) e bloqueio fundamentado para `Dívida municipal direta`. A revisão visual de 10/11/2026 adicionou busca nominal, alternância de direção, posição da cidade ativa, três destaques e barras proporcionais. Status: concluída.


## 04-06 — Testar piloto e expandir cobertura

- [x] Implementar ou produzir a entrega delimitada.
- [x] Verificar: Oito cidades do piloto, todas as disponíveis e estados de ausência testados por teclado/toque.
- [x] Registrar caminho da evidência e atualizar status.

Depende de: 04-05.
Evidência: `app/src/lib/municipalComparisonAndRanking.test.ts` (11 testes aprovados no Vitest), `app/scripts/capture-qa.mjs`, capturas em `evidencias/qa/` (`390px`, `768px`, `1440px` sem rolagem horizontal) e `evidencias/QA_FRONTEND.md`. Status: concluída em 09/11/2026.
