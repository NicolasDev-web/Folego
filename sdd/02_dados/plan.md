# Coleta e tratamento reprodutível — plano técnico

Entrada: documentos do pacote, evidências e entregas das dependências (00).

## Sequência

1. Implementar adaptadores SCR/IBGE/MTE → Downloads com timeout, cache, paginação completa, hashes e competência.
2. Normalizar campos e unidades por versão → Money, datas e códigos normalizados; mudança de schema causa erro legível.
3. Separar fatos e construir dimensões → Nenhum total/subtotal duplicado; UF, município e sub-região permanecem distintos.
4. Ingerir pesquisas e registrar extrações → Tabelas estruturadas ou conferência de publicação; denominador e cobertura documentados.
5. Implementar indicadores prioritários → Fórmulas de INDICADORES com casos de ponderação, null e denominador zero.
6. Exportar agregados e relatório de qualidade → Observações respeitam contrato e matriz de cobertura; execução repetida é estável.

## Verificação

Revisar cada critério da spec usando evidência concreta: tabela, log, teste, tela ou documento conforme a tarefa. Testar cálculos e jornadas materiais; não criar testes que apenas repetem rótulos ou implementação. Uma evidência de disponibilidade não certifica série histórica inteira.

## Saída e passagem de fase

Pipeline, dados agregados, manifesto e relatório de qualidade. Atualizar STATUS.md e registrar decisões. Se fonte bloquear uma tarefa, usar o caminho alternativo definido na viabilidade e seguir o que for independente; não simular conclusão.

## Riscos e resposta

Fonte instável: preservar versão validada e expor competência. Escala incompatível: separar bloco/território. Complexidade de interface: reduzir filtros simultâneos. Falta de dados: estado de ausência e explicação. Não sacrificar UX por um volume maior de gráficos.
