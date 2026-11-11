# Narrativa, séries e perfis — microtarefas

## 05-01 — Analisar Ceará/Brasil/Nordeste em recortes comuns

- [x] Implementar ou produzir a entrega delimitada.
- [x] Verificar: Saldos, participação e inadimplência com datas e universos alinhados.
- [x] Registrar caminho da evidência e atualizar status.

Depende de: entrada da fase.
Evidência: `app/src/lib/investigationAnalysis.ts`, `app/src/components/InvestigationChapters.tsx` (`#panorama`), `01_contexto/SINTESE_INVESTIGATIVA_FASE05.md` e `evidencias/qa/home-capitulo1-panorama-1440.png`. Status: concluída em 09/11/2026.


## 05-02 — Analisar composição por modalidade/renda

- [x] Implementar ou produzir a entrega delimitada.
- [x] Verificar: Fatos distinguidos de mudanças de composição e de equivalência em salários mínimos.
- [x] Registrar caminho da evidência e atualizar status.

Depende de: 05-01.
Evidência: `app/src/components/InvestigationChapters.tsx` (`#dividas`), separando modalidades PF, faixas de porte em salários mínimos, ocupações PF e sub-regiões postais `BCB-SUB 60–63` (`status: parcial`), e `evidencias/qa/home-capitulo3-perfis-1440.png`. Status: concluída em 09/11/2026.


## 05-03 — Construir evolução e quebras metodológicas

- [x] Implementar ou produzir a entrega delimitada.
- [x] Verificar: Lacunas e mudança de 2025 visíveis; sem suavização ou comparações incompatíveis.
- [x] Registrar caminho da evidência e atualizar status.

Depende de: 05-02.
Evidência: `app/src/components/InvestigationChapters.tsx` (`#evolucao`), `splitSeriesAround2025Break` em `app/src/lib/investigationAnalysis.ts` e `evidencias/qa/home-capitulo2-evolucao-quebra2025-1440.png`. Status: concluída em 09/11/2026.


## 05-04 — Analisar renda/trabalho e pesquisa local

- [x] Implementar ou produzir a entrega delimitada.
- [x] Verificar: Periodicidades distintas identificadas; associações não viram causas.
- [x] Registrar caminho da evidência e atualizar status.

Depende de: 05-03.
Evidência: `app/src/components/InvestigationChapters.tsx` (`#trabalho-e-percepcao`), com `2025-11` do IPDC Fortaleza (`capital_pesquisa`) rastreável ao relatório histórico oficial e contrastando PNAD trimestral e Novo Caged mensal, e `evidencias/qa/home-capitulo4-trabalho-percepcao-1440.png`. Status: concluída em 09/11/2026.


## 05-05 — Redigir títulos e explicações com lastro

- [x] Implementar ou produzir a entrega delimitada.
- [x] Verificar: Cada achado liga a tabela/fórmula; perguntas permanecem quando evidência não resolve.
- [x] Registrar caminho da evidência e atualizar status.

Depende de: 05-04.
Evidência: `01_contexto/SINTESE_INVESTIGATIVA_FASE05.md` e quadros "O que a evidência comprova vs. O que permanece em aberto" em `app/src/components/InvestigationChapters.tsx`. Status: concluída em 09/11/2026.


## 05-06 — Integrar método e exportação

- [x] Implementar ou produzir a entrega delimitada.
- [x] Verificar: CSV filtrado com definições; notas simples e documentação completa acessíveis.
- [x] Registrar caminho da evidência e atualizar status.

Depende de: 05-05.
Evidência: `observationsToCsv` em `app/src/lib/investigationAnalysis.ts`, `app/src/pages/MethodPage.tsx` e capturas `evidencias/qa/metodo-1440.png`, `metodo-768.png` e `metodo-390.png`. Status: concluída em 09/11/2026.
