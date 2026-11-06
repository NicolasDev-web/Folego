# Explorador municipal — especificação

Status: em andamento. Dependências: 02 + 03; caminho B definido na fase 00.

## Objetivo

Entregar mapa, busca, ficha e comparação com a escala territorial efetiva de cada indicador.

## Requisitos

- FR-01: Carregar geometrias e códigos oficiais. Aceite: Cobertura da lista IBGE conferida; geometria sem correspondência gera alerta.
- FR-02: Implementar mapa e legenda acessível. Aceite: Escala e ausência distintas; seleção sincronizada com lista/tabela.
- FR-03: Construir ficha municipal. Aceite: Competência e fonte em cada bloco; contexto regional separado da observação municipal.
- FR-04: Construir comparação de até três cidades. Aceite: Indicador/período/universo compatíveis; filtro impossível explicado.
- FR-05: Implementar ranking apenas para medidas elegíveis. Aceite: Ordenação trata empate/null; número de municípios excluídos visível.
- FR-06: Testar piloto e expandir cobertura. Aceite: Oito cidades do piloto, todas as disponíveis e estados de ausência testados por teclado/toque.

## Entregáveis

Explorador municipal completo e matriz de cobertura ligada à UI.

## Portão de conclusão

Não há atribuição de taxa estadual/regional a município; caminho B funciona se dado local de dívida faltar.

## Limites

Não ampliar universo ou geografia para preencher lacunas. Não declarar o trabalho concluído com dados demonstrativos. Mudanças de escopo e de método devem ser registradas em sdd/DECISOES.md.
