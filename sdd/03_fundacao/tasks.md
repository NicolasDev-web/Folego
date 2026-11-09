# Base do frontend e componentes — microtarefas

## 03-01 — Criar projeto React/TS/Vite e rotas

- [x] Implementar ou produzir a entrega delimitada.
- [x] Verificar: Build limpo e navegação principal com títulos semânticos.
- [x] Registrar caminho da evidência e atualizar status.

Depende de: entrada da fase.
Evidência: `app/`, `app/src/router.tsx` e `evidencias/QA_FRONTEND.md`. Status: concluída em 06/11/2026.


## 03-02 — Implementar tokens e layout responsivo

- [x] Implementar ou produzir a entrega delimitada.
- [x] Verificar: Hero, navegação e SectionHeader consistentes sem overflow.
- [x] Registrar caminho da evidência e atualizar status.

Depende de: 03-01.
Evidência: `app/src/styles.css`, `app/src/components/SectionHeader.tsx`, `evidencias/QA_FRONTEND.md` e `evidencias/qa/`. Status: concluída em 06/11/2026.


## 03-03 — Construir componentes de filtro e fonte

- [x] Implementar ou produzir a entrega delimitada.
- [x] Verificar: Busca, segmentado, MetricCard e SourceNote funcionam por teclado.
- [x] Registrar caminho da evidência e atualizar status.

Depende de: 03-02.
Evidência: `app/src/components/MunicipalitySearch.tsx`, `app/src/components/SegmentedControl.tsx`, `app/src/components/MetricCard.tsx` e `app/src/components/SourceNote.tsx`. Status: concluída em 09/11/2026.


## 03-04 — Criar adaptador de dados/cobertura

- [x] Implementar ou produzir a entrega delimitada.
- [x] Verificar: Estados observado, indisponível e erro seguem contrato; fixtures ficam isoladas.
- [x] Registrar caminho da evidência e atualizar status.

Depende de: 03-03.
Evidência: `app/src/lib/observation.ts`, `app/src/lib/observation.test.ts`, `app/src/data/useInvestigationData.ts` e `app/src/lib/investigationAnalysis.test.ts`. Status: concluída em 09/11/2026.


## 03-05 — Persistir filtros públicos na URL

- [x] Implementar ou produzir a entrega delimitada.
- [x] Verificar: Refresh e link reproduzem estado; nenhum dado pessoal na URL.
- [x] Registrar caminho da evidência e atualizar status.

Depende de: 03-04.
Evidência: `app/src/pages/CitiesPage.tsx` (`?cidade=`, `?comparar=`) e `app/src/components/InvestigationChapters.tsx` (`?territorio=`, `?valor=`). Status: concluída em 09/11/2026.


## 03-06 — Verificar componentes nas três larguras

- [x] Implementar ou produzir a entrega delimitada.
- [x] Verificar: Screenshots de QA e lista de correções; foco e ordem de leitura adequados.
- [x] Registrar caminho da evidência e atualizar status.

Depende de: 03-05.
Evidência: `evidencias/QA_FRONTEND.md` e `evidencias/qa/` (`390px`, `768px`, `1440px` sem overflow horizontal). Status: concluída em 09/11/2026.
