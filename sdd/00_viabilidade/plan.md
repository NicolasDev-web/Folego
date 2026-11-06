# Viabilidade e prova de cobertura — plano técnico

Entrada: documentos do pacote, evidências e entregas das dependências (Nenhuma).

## Sequência

1. Inventariar arquivos e tabelas das fontes centrais → Catálogo com URL, licença/termos, unidade, grão, datas e versão por fonte.
2. Resolver oficialmente a geografia SUB_REGIAO → Tabela oficial de correspondência ou decisão documentada de não usar na escala municipal; códigos não são convertidos por suposição.
3. Verificar fonte direta de dívida municipal → Aplicar os seis critérios de VIABILIDADE_MUNICIPAL; registrar cobertura ou indisponibilidade sem inventar taxa.
4. Validar lista municipal e contexto IBGE/MTE → Municípios CE, códigos, tabela de renda/população e fonte de emprego com competências reais.
5. Montar matriz território × indicador × período → Status observado/parcial/suprimido/indisponível; piloto com oito cidades e regra de expansão.
6. Escolher escopo municipal A ou B e janela temporal → Decisão em relatório de viabilidade com evidências e limitações; MVP permanece executável.

## Verificação

Revisar cada critério da spec usando evidência concreta: tabela, log, teste, tela ou documento conforme a tarefa. Testar cálculos e jornadas materiais; não criar testes que apenas repetem rótulos ou implementação. Uma evidência de disponibilidade não certifica série histórica inteira.

## Saída e passagem de fase

Relatório de viabilidade, catálogo revisado, amostra bruta com hash, matriz de cobertura e decisão geográfica. Atualizar STATUS.md e registrar decisões. Se fonte bloquear uma tarefa, usar o caminho alternativo definido na viabilidade e seguir o que for independente; não simular conclusão.

## Riscos e resposta

Fonte instável: preservar versão validada e expor competência. Escala incompatível: separar bloco/território. Complexidade de interface: reduzir filtros simultâneos. Falta de dados: estado de ausência e explicação. Não sacrificar UX por um volume maior de gráficos.
