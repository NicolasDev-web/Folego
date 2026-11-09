# Estado do projeto

O planejamento inicial, a inspeção da referência, o portão de viabilidade municipal e toda a fase de coleta e tratamento reprodutível (`02_dados`) estão concluídos. A aplicação já oferece busca, mapa e ficha para os 184 municípios, com população, renda domiciliar e emprego formal oficiais e ausência de dívida local tratada explicitamente, além dos pacotes pré-agregados e validados de crédito (`BCB-SCR`, `BCB-SUB`, `BCB-RENDA`), mercado de trabalho (`PNAD`, `Novo Caged` ajustado) e pesquisas de percepção (`PEIC`, `IPDC`).

| Fase | Estado | Dependência |
|---|---|---|
| 00_viabilidade | Concluída | Opção B; relatório, catálogo, amostras, hashes e matriz de cobertura registrados |
| 01_ux | Em andamento | Composição visual responsiva e jornadas iniciais implementadas; comparação e teste com pessoas pendentes |
| 02_dados | Concluída | 02-01 a 02-06 concluídas; adaptadores, normalização, fatos Parquet, indicadores, 872 observações validadas contra contrato e relatório de reconciliação entregues |
| 03_fundacao | Em andamento | 03-01 e 03-02 concluídas; componentes e adaptador em evolução |
| 04_cidades | Em andamento | 04-01 a 04-03 concluídas; mapa territorial com zoom e modos opcionais de emprego, renda e população; comparação e ranking pendentes |
| 05_investigacao | Planejada | 02 concluída + 03; integrar 04 |
| 06_validacao | Planejada | 04 + 05 |
| 07_entrega | Planejada | 06 |

48 microtarefas principais; cada uma tem execução, verificação e evidência. As fases `00_viabilidade` e `02_dados` (12 tarefas) e cinco tarefas das fases `03_fundacao` e `04_cidades` estão concluídas (17/48). Conclusões e adiantamentos permanecem registrados nos arquivos de tarefas, sem antecipar achados estatísticos na interface ou pesquisa com pessoas.
