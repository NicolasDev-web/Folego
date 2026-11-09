# Relatório de viabilidade municipal

Data da decisão: 06/11/2026.

## Resultado executivo

O MVP adota a **opção B**: os municípios entram com contexto oficial e com estados de cobertura explícitos, enquanto dívida e atraso permanecem na escala estadual ou regional compatível com cada fonte. Não será publicada uma taxa municipal de endividamento ou inadimplência sem fonte direta que satisfaça os seis critérios definidos em `VIABILIDADE_MUNICIPAL.md`.

A base validou os 184 municípios do Ceará por código IBGE, população e renda do Censo 2022 e emprego formal de setembro de 2026. A interface exibe esse contexto observado e mantém a dívida municipal como indisponível, sem substituir ausência por zero ou estimativa.

## Evidências coletadas

| Fonte | Recorte e período verificados | Resultado | Uso no MVP |
|---|---|---|---|
| IBGE Localidades | Ceará; consulta em 06/11/2026 | 184 municípios com códigos únicos | Lista territorial canônica |
| SIDRA, agregado 4714, variável 93 | Censo 2022; Ceará | 184 valores de população; correspondência exata com a lista territorial | Contexto municipal observado |
| BCB SCR.data | Desde 06/2012; mensal; geografia estadual | Carteira e atraso disponíveis por UF, sem identificação municipal | Investigação estadual |
| BCB SCR por sub-região | Amostra CE, competência 08/2026 | 62 linhas e códigos 60, 61, 62 e 63; não foi localizada correspondência oficial pública entre códigos e municípios | Bloco separado; não municipalizar |
| MTE Novo Caged | Competência 09/2026; 112.188 movimentações no Ceará | 58.672 admissões, 53.516 desligamentos e saldo de 5.156; agregado completo para 184 municípios | Contexto municipal observado; ajustes posteriores ainda pendentes |

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

- 24 observados: população, renda censitária e emprego formal;
- 4 parciais: códigos sub-regionais sem correspondência municipal;
- 8 indisponíveis: dívida ou inadimplência direta municipal.

“Parcial” indica uma fonte demonstrada cuja transformação final ainda não foi incorporada ou cuja geografia não pode ser atribuída às cidades. “Indisponível” nunca é convertido em zero.

## Janela temporal do MVP

| Camada | Janela escolhida | Justificativa |
|---|---|---|
| SCR estadual | 01/2019 em diante | Série recente suficiente para tendência, incluindo o período pré e pós-pandemia; a fonte existe desde 06/2012 |
| População municipal | Censo 2022 | Observação censitária oficial e comparável para os 184 municípios |
| Novo Caged municipal | Retrato 09/2026 incorporado; série desde 01/2020 em etapa posterior | Compatível com a metodologia vigente; competência corrente identificada como sem ajustes posteriores |
| SCR sub-regional | Competências mensais disponíveis, em módulo separado | Não atribuir os códigos às cidades sem correspondência oficial |

## Consequência para o produto

O explorador municipal permanece útil e honesto: mostra população, renda e emprego formal; explica claramente por que a dívida municipal não está disponível; e conduz a pessoa para o panorama estadual quando a pergunta exigir indicadores de crédito. Comparações e rankings só serão habilitados entre observações de mesmo indicador, universo, período e versão.

## Próximos passos

1. Ingerir e validar o SCR.data estadual de 2019 em diante.
2. Incorporar a série histórica e os ajustes posteriores do Novo Caged.
3. Manter a busca por correspondência oficial de `SUB_REGIAO`, sem bloquear o MVP municipal de contexto.

A tabela municipal de renda foi fixada em 09/11/2026: SIDRA 10295, variáveis 13431 e 13534, período 2022 e classificações totais. O manifesto está em `metadata/municipal_income_manifest.json`.

O retrato municipal do emprego formal foi fixado em 09/11/2026: `CAGEDMOV202609`, município do estabelecimento e saldo igual a admissões menos desligamentos. O agregado fecha com os 5.156 postos divulgados para o Ceará e com os cinco destaques municipais publicados. O manifesto está em `metadata/municipal_employment_manifest.json`.

