# Catálogo de fontes e decisões

Verificação documental, amostral e ingestão da Fase 02 concluídas em 09/11/2026. URLs, horários, tamanhos e hashes dos arquivos coletados estão em `metadata/phase00_manifest.json`, `metadata/phase02_manifest.json`, `metadata/scr_data_monthly_hashes.json`, `metadata/municipal_income_manifest.json` e `metadata/municipal_employment_manifest.json`.

| ID | Fonte e acesso | Cobertura útil | Frequência | Uso e estado |
|---|---|---|---|---|
| BCB-SCR | https://www.bcb.gov.br/pda/desig/scrdata_{2019..2026}.zip | UF, Região Nordeste e Brasil; renda/ocupação/modalidade; desde 06/2012 | Mensal | Núcleo estadual; ODbL; 93 CSVs catalogados e 33 competências (`2019-08..2026-09`) extraídas e reconciliadas com SGS 20541 |
| BCB-SUB | https://olinda.bcb.gov.br/olinda/servico/scr_sub_regiao/versao/v1/odata/ | UF + código de sub-região (`60..63`); desde 03/2005 | Mensal | ODbL; 10 competências (`2019-08..2026-08`) coletadas para o CE. Sem correspondência municipal oficial; mantido em `sub_regiao` (`parcial`) |
| BCB-RENDA | https://api.bcb.gov.br/dados/serie/bcdata.sgs.29034/dados?formato=json | Brasil | Mensal | Série SGS 29034 (`2018-01..2026-08`) coletada; contexto macro nacional; não municipalizar |
| PEIC | https://portal-bucket.azureedge.net/wp-content/2026/11/SERIES_PEIC_ENVIO-3.xls | Nacional; coleta nas capitais/DF | Mensal | Planilhas estruturadas out/2026 e nov/2026 coletadas (`2025-08..2026-10`); denominador `% do total de famílias` documentado |
| IPDC | https://www.fecomercio-ce.com.br/wp-json/wp/v2/posts?search=endividamento&per_page=20 | Fortaleza (`capital_pesquisa` — `2304400`) | Mensal | Boletins mensais (`2025-04..2026-10`) auditados e conferidos; `2025-11` mantido como `null` (`indisponivel`) por ausência de boletim |
| PNAD | https://apisidra.ibge.gov.br/values/t/4099 e `6472` | Brasil, Nordeste, Ceará e Fortaleza (`2304400`) | Trimestral | Desocupação (`4099`) e rendimento habitual real/nominal (`6472`) + CVs coletados (`2019-T1..2026-T2`) |
| IPCA | https://servicodados.ibge.gov.br/api/v3/agregados/1737/periodos/201801-202609/variaveis/2266?localidades=N1[1] | Brasil | Mensal | Número-índice mensal (`2266`) coletado (`2018-01..2026-09`) para deflação a preços de `2026-09` |
| CENSO | https://servicodados.ibge.gov.br/api/v3/agregados/4714/periodos/2022/variaveis/93?localidades=N6[N3[23]] | 184 municípios do Ceará; população residente | Censo 2022 | Contexto municipal observado; códigos conferidos contra Localidades |
| CENSO-RENDA | https://sidra.ibge.gov.br/tabela/10295 | BR, NE, CE e 184 municípios do Ceará; rendimento domiciliar per capita médio e mediano | Censo 2022 | Valores nominais mensais observados; totais de sexo, cor ou raça e idade; universo e exclusões preservados no manifesto |
| GEO | https://servicodados.ibge.gov.br/api/v3/malhas/estados/23?formato=application/vnd.geo+json&qualidade=minima&intrarregiao=municipio | 184 municípios do Ceará | Snapshot consultado em 06/11/2026 | GeoJSON de qualidade mínima para visão estadual; todos os `codarea` conferidos contra o cadastro; não usar para medição de precisão |
| LOCAL | https://servicodados.ibge.gov.br/api/v1/localidades/estados/23/municipios?orderBy=nome | Cadastro municipal CE | Cadastro | 184 municípios e códigos validados; lista territorial canônica; não é indicador de dívida |
| CAGED | ftp://ftp.mtps.gov.br/pdet/microdados/NOVO%20CAGED/2026/202609/CAGEDMOV202609.7z e Tabelas Ajustadas `2020-01..2026-08` | BR, NE, CE e 184 municípios do Ceará; estoque, admissões, desligamentos e saldo | Mensal | Microdado `2026-09` (sem ajustes) + série ajustada `2020-01..2026-08` reconciliada com diferença zero nos fluxos em todos os 80 meses |
| CBO | https://www.gov.br/trabalho-e-emprego/pt-br/assuntos/cbo/servicos/downloads/cbo2002-ocupacao.csv | Títulos de ocupações do Novo Caged | Dicionário consultado em 09/11/2026 | Cruzamento exato pelo código de seis dígitos; nove códigos residuais sem título não aparecem nos destaques exibidos |
| CONSUMIDOR | https://www.consumidor.gov.br/pages/conteudo/publico/62 | UF/município do consumidor conforme registro | Registros administrativos | Complementar; dados abertos e consultas confirmados, schema fora do núcleo do MVP |
| SERASA | https://www.serasa.com.br/limpa-nome-online/blog/mapa-da-inadimplencia-e-renogociacao-de-dividas-no-brasil/ | Brasil/UF e recortes publicados | Relatórios por edição | Complementar; série municipal aberta completa não confirmada |
| POF | https://www.ibge.gov.br/estatisticas/sociais/populacao/9050-pesquisa-de-orcamentos-familiares.html | Brasil/UF conforme edição/tabela | Edições | Contexto histórico 2017–2018; não retrato mensal atual |
| ESTBAN | https://www.bcb.gov.br/estatisticas/estatisticabancariamunicipios?modalAberto=baixar-arquivos | Municípios/agências | Mensal | Só contexto bancário. Saldos contábeis por município não medem dívida dos residentes |
| MDCR | https://dadosabertos.bcb.gov.br/dataset/matrizdadoscreditorural | Municípios; contratos rurais | Mensal | Capítulo rural opcional; contratação não é inadimplência geral das famílias |

## Acesso reprodutível ao SCR.data

A metodologia v2 informa arquivos anuais em `https://www.bcb.gov.br/pda/desig/scrdata_{ANO}.zip`, contendo CSVs mensais separados por ponto e vírgula. O adaptador `pipeline/extract/bcb_adapter.py` inspeciona o diretório central ZIP via HTTP Range, valida o cabeçalho de 24 colunas, verifica o hash SHA-256 de cada CSV descompactado e agrega via DuckDB. Os valores financeiros em `scrdata_AAAAMM.csv` estão expressos diretamente em Reais (`R$`), conforme reconciliação com a série `SGS 20541`.

## Consulta técnica do serviço sub-regional

Metadados: `https://olinda.bcb.gov.br/olinda/servico/scr_sub_regiao/versao/v1/odata/$metadata`.

Função: `scr_sub_regiao(DataBase=@DataBase)`; parâmetro inteiro no formato AAAAMM. Os códigos de sub-região observados no Ceará foram `60, 61, 62 e 63`. A documentação consultada define `SUB_REGIAO` pelos dois primeiros dígitos do CEP de residência do cliente, sem fornecer tabela oficial de correspondência com municípios IBGE; por isso `SUB_REGIAO` permanece estritamente em `territory_level: "sub_regiao"` com `status: "parcial"`.

## Registro por arquivo coletado

Todos os arquivos coletados registram `source_id`, URL exata, data de coleta, competência inicial/final, unidade, geografia, licença, versão metodológica, hash SHA-256 e contagem de linhas em `metadata/phase02_manifest.json`.
