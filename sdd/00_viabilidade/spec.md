# Viabilidade e prova de cobertura — especificação

Status: planejado. Dependências: Nenhuma.

## Objetivo

Estabelecer quais perguntas podem ser respondidas em cada escala antes de prometer números locais.

## Requisitos

- FR-01: Inventariar arquivos e tabelas das fontes centrais. Aceite: Catálogo com URL, licença/termos, unidade, grão, datas e versão por fonte.
- FR-02: Resolver oficialmente a geografia SUB_REGIAO. Aceite: Tabela oficial de correspondência ou decisão documentada de não usar na escala municipal; códigos não são convertidos por suposição.
- FR-03: Verificar fonte direta de dívida municipal. Aceite: Aplicar os seis critérios de VIABILIDADE_MUNICIPAL; registrar cobertura ou indisponibilidade sem inventar taxa.
- FR-04: Validar lista municipal e contexto IBGE/MTE. Aceite: Municípios CE, códigos, tabela de renda/população e fonte de emprego com competências reais.
- FR-05: Montar matriz território × indicador × período. Aceite: Status observado/parcial/suprimido/indisponível; piloto com oito cidades e regra de expansão.
- FR-06: Escolher escopo municipal A ou B e janela temporal. Aceite: Decisão em relatório de viabilidade com evidências e limitações; MVP permanece executável.

## Entregáveis

Relatório de viabilidade, catálogo revisado, amostra bruta com hash, matriz de cobertura e decisão geográfica.

## Portão de conclusão

Nenhuma taxa municipal é publicada sem passar pelo portão; cada fonte tem cobertura e unidade conhecidas.

## Limites

Não ampliar universo ou geografia para preencher lacunas. Não declarar o trabalho concluído com dados demonstrativos. Mudanças de escopo e de método devem ser registradas em sdd/DECISOES.md.
