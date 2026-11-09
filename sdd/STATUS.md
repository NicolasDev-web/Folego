# Estado do projeto

O planejamento inicial, a inspeção da referência, o portão de viabilidade municipal (`00_viabilidade`), toda a fase de coleta e tratamento reprodutível (`02_dados`) e toda a fase do explorador municipal (`04_cidades`) estão concluídos. A aplicação oferece busca, mapa interativo (território com zoom regional, emprego, renda e população), ficha municipal, comparação controlada de até três cidades (`04-04`) e ranking estrito para medidas elegíveis com tratamento explícito de empates e `null` (`04-05`), validados nas 8 cidades-piloto e nos 184 municípios (`04-06`), além dos pacotes pré-agregados e validados de crédito (`BCB-SCR`, `BCB-SUB`, `BCB-RENDA`), mercado de trabalho (`PNAD`, `Novo Caged` ajustado) e pesquisas de percepção (`PEIC`, `IPDC`).

| Fase | Estado | Dependência |
|---|---|---|
| 00_viabilidade | Concluída | Opção B; relatório, catálogo, amostras, hashes e matriz de cobertura registrados |
| 01_ux | Em andamento | Composição visual responsiva e jornadas iniciais implementadas; comparação e teste com pessoas pendentes |
| 02_dados | Concluída | 02-01 a 02-06 concluídas; adaptadores, normalização, fatos Parquet, indicadores, 872 observações validadas contra contrato e relatório de reconciliação entregues |
| 03_fundacao | Em andamento | 03-01 e 03-02 concluídas; componentes e adaptador em evolução |
| 04_cidades | Concluída | 04-01 a 04-06 concluídas; mapa, ficha, comparação de até 3 municípios, ranking elegível com tratamento de empate/`null` e QA das 8 cidades-piloto e 184 municípios entregues |
| 05_investigacao | Planejada | 02 concluída + 03 + 04 concluída |
| 06_validacao | Planejada | 04 + 05 |
| 07_entrega | Planejada | 06 |

48 microtarefas principais; cada uma tem execução, verificação e evidência. As fases `00_viabilidade`, `02_dados` e `04_cidades` (18 tarefas) e duas tarefas da fase `03_fundacao` estão concluídas (20/48). Conclusões e adiantamentos permanecem registrados nos arquivos de tarefas, sem antecipar achados estatísticos na interface ou pesquisa com pessoas.
