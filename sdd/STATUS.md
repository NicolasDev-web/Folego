# Estado do projeto

As fases técnicas `00_viabilidade`, `02_dados`, `03_fundacao`, `04_cidades`, `05_investigacao` e `07_entrega` estão integralmente concluídas, bem como todas as entregas técnicas e de auditoria de `01_ux` e `06_validacao` (restando exclusivamente as duas tarefas de sessões com participantes humanos reais `01-05` e `06-04`, que por regra inegociável não são simuladas).

| Fase | Estado | Dependência |
|---|---|---|
| 00_viabilidade | Concluída | Opção B; relatório, catálogo, amostras, hashes e matriz de cobertura registrados |
| 01_ux | Em andamento (5/6) | Fluxos, wireframes, sistema visual, protótipo das 5 tarefas e homologação responsiva concluídos; pendente apenas `01-05` (teste com 5 participantes reais) |
| 02_dados | Concluída (6/6) | Adaptadores, normalização, fatos Parquet, indicadores, 872 observações validadas contra contrato e relatório de reconciliação entregues |
| 03_fundacao | Concluída (6/6) | Rotas, tokens, `SegmentedControl`, `MetricCard`, `SourceNote`, adaptador de cobertura, persistência em URL e QA nas 3 larguras entregues |
| 04_cidades | Concluída (6/6) | Mapa com 4 modos e zoom regional, ficha municipal, comparação de até 3 cidades, ranking elegível com tratamento de empate/`null` e QA das 8 cidades-piloto e 184 municípios entregues |
| 05_investigacao | Concluída (6/6) | Capítulos 01 a 04 integrados em `/`, quebra metodológica de `2025-01` visível sem suavização, lacuna `2025-11` preservada como `null`, síntese com lastro e exportação CSV auditável em `/` e `/metodo` |
| 06_validacao | Em andamento (5/6) | Reconciliação estatística (`06-01`), auditoria de ausência (`06-02`), acessibilidade/teclado (`06-03`), QA visual (`06-05`) e registro de riscos (`06-06`) concluídos; pendente apenas `06-04` (usabilidade com participantes reais) |
| 07_entrega | Concluída (6/6) | Build estático verificado, desempenho medido, deploy em produção na Vercel (`https://folego-vert.vercel.app`), runbook de atualização/rollback e README finalizados |

46 de 48 microtarefas principais estão concluídas e verificadas com evidência rastreável (`46/48`). As 2 tarefas restantes (`01-05` e `06-04`) dependem exclusivamente de sessões com usuários humanos reais.
