# Validação estatística, UX e acessibilidade — plano técnico

Entrada: documentos do pacote, evidências e entregas das dependências (04 + 05).

## Sequência

1. Reconciliar métricas e amostras com fontes → Ponderação, estoques, operações e versões revisados em checklist assinado pelo executor.
2. Auditar cobertura e ausência → Dados suprimidos/null preservados; filtros e rankings não inventam precisão.
3. Executar jornadas e testes de acessibilidade → Busca, comparação e fonte por teclado; teste de zoom, contraste e leitura de gráficos.
4. Revisar usabilidade com participantes → Achados reais e correções priorizadas, sem alegar representatividade estatística.
5. Fazer QA visual e conteúdo → Telas 390/768/1440, títulos, legendas e datas; imagens de QA internas.
6. Corrigir defeitos e registrar riscos restantes → Problemas críticos fechados; pendências menores registradas com impacto.

## Verificação

Revisar cada critério da spec usando evidência concreta: tabela, log, teste, tela ou documento conforme a tarefa. Testar cálculos e jornadas materiais; não criar testes que apenas repetem rótulos ou implementação. Uma evidência de disponibilidade não certifica série histórica inteira.

## Saída e passagem de fase

Relatório de QA, evidências, correções e lista de limites do produto. Atualizar STATUS.md e registrar decisões. Se fonte bloquear uma tarefa, usar o caminho alternativo definido na viabilidade e seguir o que for independente; não simular conclusão.

## Riscos e resposta

Fonte instável: preservar versão validada e expor competência. Escala incompatível: separar bloco/território. Complexidade de interface: reduzir filtros simultâneos. Falta de dados: estado de ausência e explicação. Não sacrificar UX por um volume maior de gráficos.
