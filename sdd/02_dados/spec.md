# Coleta e tratamento reprodutível — especificação

Status: planejado. Dependências: 00.

## Objetivo

Produzir tabelas verificáveis que alimentem os componentes sem misturar universos.

## Requisitos

- FR-01: Implementar adaptadores SCR/IBGE/MTE. Aceite: Downloads com timeout, cache, paginação completa, hashes e competência.
- FR-02: Normalizar campos e unidades por versão. Aceite: Money, datas e códigos normalizados; mudança de schema causa erro legível.
- FR-03: Separar fatos e construir dimensões. Aceite: Nenhum total/subtotal duplicado; UF, município e sub-região permanecem distintos.
- FR-04: Ingerir pesquisas e registrar extrações. Aceite: Tabelas estruturadas ou conferência de publicação; denominador e cobertura documentados.
- FR-05: Implementar indicadores prioritários. Aceite: Fórmulas de INDICADORES com casos de ponderação, null e denominador zero.
- FR-06: Exportar agregados e relatório de qualidade. Aceite: Observações respeitam contrato e matriz de cobertura; execução repetida é estável.

## Entregáveis

Pipeline, dados agregados, manifesto e relatório de qualidade.

## Portão de conclusão

Totais conferidos em recortes de referência; nenhuma linha perdida por join sem relatório.

## Limites

Não ampliar universo ou geografia para preencher lacunas. Não declarar o trabalho concluído com dados demonstrativos. Mudanças de escopo e de método devem ser registradas em sdd/DECISOES.md.
