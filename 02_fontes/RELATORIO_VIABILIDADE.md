# Relatório de viabilidade municipal

Data da decisão: 06/11/2026.

## Resultado executivo

O MVP adota a **opção B**: os municípios entram com contexto oficial e com estados de cobertura explícitos, enquanto dívida e atraso permanecem na escala estadual ou regional compatível com cada fonte. Não será publicada uma taxa municipal de endividamento ou inadimplência sem fonte direta que satisfaça os seis critérios definidos em `VIABILIDADE_MUNICIPAL.md`.

A base inicial validou os 184 municípios do Ceará por código IBGE, população do Censo 2022 para todos eles e o piloto de oito cidades. A interface passa a exibir a população observada e mantém a dívida municipal como indisponível, sem substituir ausência por zero ou estimativa.

## Evidências coletadas

| Fonte | Recorte e período verificados | Resultado | Uso no MVP |
|---|---|---|---|
| IBGE Localidades | Ceará; consulta em 06/11/2026 | 184 municípios com códigos únicos | Lista territorial canônica |
| SIDRA, agregado 4714, variável 93 | Censo 2022; Ceará | 184 valores de população; correspondência exata com a lista territorial | Contexto municipal observado |
| BCB SCR.data | Desde 06/2012; mensal; geografia estadual | Carteira e atraso disponíveis por UF, sem identificação municipal | Investigação estadual |
| BCB SCR por sub-região | Amostra CE, competência 08/2026 | 62 linhas e códigos 60, 61, 62 e 63; não foi localizada correspondência oficial pública entre códigos e municípios | Bloco separado; não municipalizar |
| MTE Perfil do Município / Novo Caged | Competência oficial confirmada até 08/2026 | Fonte municipal demonstrada; série ajustada, leiaute e extração histórica ainda precisam ser fixados | Próxima integração de contexto |

Os arquivos brutos preservados, URLs exatas, horário de coleta, tamanhos e hashes SHA-256 estão em `metadata/phase00_manifest.json`. A matriz de cobertura do piloto está em `data/processed/coverage_matrix.csv`.

## Teste da fonte direta de dívida municipal

Nenhuma fonte pública direta foi demonstrada, nesta etapa, como apta a publicar dívida ou inadimplência de pessoas físicas para todos os municípios do Ceará. Isso não afirma que os dados não existam; registra que não foi encontrada uma série pública que passe integralmente pelo portão de qualidade.

| Critério | Resultado | Motivo |
|---|---|---|
| Município identificado oficialmente | Não atendido | SCR público chega a UF ou código de sub-região sem correspondência municipal publicada na documentação consultada |
| Significado da localização documentado | Não atendido | Não é possível afirmar residência municipal a partir dos códigos observados |
| Conceito, unidade, numerador e denominador | Parcial | Campos do SCR são documentados, mas não sustentam uma taxa municipal direta |
| Competência e cobertura territorial conhecidas | Parcial | Competência mensal conhecida; universo municipal não demonstrado |
| Supressão, sigilo, revisão e ausência | Não atendido para município | Não há produto municipal liberado sobre o qual aplicar essas regras |
| Uso e redistribuição compatíveis | Parcial | As bases BCB são abertas, mas a agregação municipal pretendida não está disponível |

Saldos ESTBAN por agência, crédito rural por município, reclamações e publicações de birôs não substituem esse requisito: medem outros fenômenos ou não oferecem uma série municipal pública completa e reproduzível.

## Decisão geográfica

Os códigos `SUB_REGIAO` 60 a 63 permanecem como códigos da própria fonte. Eles não serão convertidos em códigos IBGE, nomes de regiões ou geometrias por inferência. O produto só poderá nomeá-los ou desenhá-los quando houver correspondência oficial verificável; até lá, qualquer análise sub-regional fica separada da experiência municipal.

## Matriz de cobertura do piloto

O piloto abrange Fortaleza, Caucaia, Maracanaú, Sobral, Juazeiro do Norte, Crato, Iguatu e Quixadá. A matriz possui 36 registros:

- 8 observados: população do Censo 2022;
- 20 parciais: renda censitária, emprego formal e quatro códigos sub-regionais sem correspondência municipal;
- 8 indisponíveis: dívida ou inadimplência direta municipal.

“Parcial” indica uma fonte demonstrada cuja transformação final ainda não foi incorporada ou cuja geografia não pode ser atribuída às cidades. “Indisponível” nunca é convertido em zero.

## Janela temporal do MVP

| Camada | Janela escolhida | Justificativa |
|---|---|---|
| SCR estadual | 01/2019 em diante | Série recente suficiente para tendência, incluindo o período pré e pós-pandemia; a fonte existe desde 06/2012 |
| População municipal | Censo 2022 | Observação censitária oficial e comparável para os 184 municípios |
| Novo Caged municipal | 01/2020 em diante, após validar ajustes e revisões | Compatível com a metodologia vigente; competência 08/2026 confirmada na consulta |
| SCR sub-regional | Competências mensais disponíveis, em módulo separado | Não atribuir os códigos às cidades sem correspondência oficial |

## Consequência para o produto

O explorador municipal permanece útil e honesto: mostra população e, nas próximas entregas, renda e emprego formal; explica claramente por que a dívida municipal não está disponível; e conduz a pessoa para o panorama estadual quando a pergunta exigir indicadores de crédito. Comparações e rankings só serão habilitados entre observações de mesmo indicador, universo, período e versão.

## Próximos passos

1. Fixar a tabela municipal de renda do Censo 2022, com universo, unidade e notas metodológicas.
2. Incorporar a série ajustada do Novo Caged e registrar revisões por competência.
3. Ingerir e validar o SCR.data estadual de 2019 em diante.
4. Manter a busca por correspondência oficial de `SUB_REGIAO`, sem bloquear o MVP municipal de contexto.

