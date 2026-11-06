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

- [ ] Implementar ou produzir a entrega delimitada.
- [ ] Verificar: Busca, segmentado, MetricCard e SourceNote funcionam por teclado.
- [ ] Registrar caminho da evidência e atualizar status.

Depende de: 03-02.
Evidência parcial: `app/src/components/MunicipalitySearch.tsx` e `app/src/components/CoveragePanel.tsx`. Busca e ficha funcionam por teclado; controles segmentados e abstrações finais de MetricCard/SourceNote permanecem pendentes. Status: em andamento.


## 03-04 — Criar adaptador de dados/cobertura

- [ ] Implementar ou produzir a entrega delimitada.
- [ ] Verificar: Estados observado, indisponível e erro seguem contrato; fixtures ficam isoladas.
- [ ] Registrar caminho da evidência e atualizar status.

Depende de: 03-03.
Evidência parcial: `app/src/lib/observation.ts`, `app/src/lib/observation.test.ts` e `app/src/data/fixtures/coverage.ts`. Estados observado e indisponível têm contrato e teste; erro de carregamento e série parcial permanecem pendentes. Status: em andamento.


## 03-05 — Persistir filtros públicos na URL

- [ ] Implementar ou produzir a entrega delimitada.
- [ ] Verificar: Refresh e link reproduzem estado; nenhum dado pessoal na URL.
- [ ] Registrar caminho da evidência e atualizar status.

Depende de: 03-04.
Evidência adiantada: `app/src/pages/CitiesPage.tsx`; a seleção `?cidade=sobral` sobrevive a recarga e link compartilhado. A conclusão aguarda 03-04. Status: adiantada, não concluída.


## 03-06 — Verificar componentes nas três larguras

- [ ] Implementar ou produzir a entrega delimitada.
- [ ] Verificar: Screenshots de QA e lista de correções; foco e ordem de leitura adequados.
- [ ] Registrar caminho da evidência e atualizar status.

Depende de: 03-05.
Evidência parcial: `evidencias/QA_FRONTEND.md` e `evidencias/qa/`; 390/768/1440 px sem overflow e movimento reduzido coberto. Auditoria completa de teclado/leitor de tela aguarda a conclusão dos componentes. Status: em andamento.
