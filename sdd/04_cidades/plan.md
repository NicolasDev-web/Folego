# Explorador municipal — plano técnico

Entrada: documentos do pacote, evidências e entregas das dependências (02 + 03; condicionado pela decisão 00).

## Sequência

1. Carregar geometrias e códigos oficiais → Cobertura da lista IBGE conferida; geometria sem correspondência gera alerta.
2. Implementar mapa e legenda acessível → Escala e ausência distintas; seleção sincronizada com lista/tabela.
3. Construir ficha municipal → Competência e fonte em cada bloco; contexto regional separado da observação municipal.
4. Construir comparação de até três cidades → Indicador/período/universo compatíveis; filtro impossível explicado.
5. Implementar ranking apenas para medidas elegíveis → Ordenação trata empate/null; número de municípios excluídos visível.
6. Testar piloto e expandir cobertura → Oito cidades do piloto, todas as disponíveis e estados de ausência testados por teclado/toque.

## Verificação

Revisar cada critério da spec usando evidência concreta: tabela, log, teste, tela ou documento conforme a tarefa. Testar cálculos e jornadas materiais; não criar testes que apenas repetem rótulos ou implementação. Uma evidência de disponibilidade não certifica série histórica inteira.

## Saída e passagem de fase

Explorador municipal completo e matriz de cobertura ligada à UI. Atualizar STATUS.md e registrar decisões. Se fonte bloquear uma tarefa, usar o caminho alternativo definido na viabilidade e seguir o que for independente; não simular conclusão.

## Riscos e resposta

Fonte instável: preservar versão validada e expor competência. Escala incompatível: separar bloco/território. Complexidade de interface: reduzir filtros simultâneos. Falta de dados: estado de ausência e explicação. Não sacrificar UX por um volume maior de gráficos.
