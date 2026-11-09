# Catálogo de fontes e decisões

Verificação documental e amostral concluída em 06/11/2026. “Confirmado” refere-se à documentação ou à consulta indicada, não a uma ingestão histórica completa. URLs, horários, tamanhos e hashes dos arquivos coletados estão em `metadata/phase00_manifest.json`.

| ID | Fonte e acesso | Cobertura útil | Frequência | Uso e estado |
|---|---|---|---|---|
| BCB-SCR | https://dadosabertos.bcb.gov.br/dataset/scr_data | UF e Brasil; renda/ocupação/modalidade; desde 06/2012 | Mensal | Núcleo estadual; ODbL; arquivos anuais ZIP/CSV; janela do MVP a partir de 01/2019 |
| BCB-SUB | https://dadosabertos.bcb.gov.br/dataset/scr-por-sub-regiao | UF + código de sub-região; desde 03/2005 | Mensal | ODbL; amostra CE 08/2026 coletada. Códigos 60–63 sem correspondência municipal oficial demonstrada; não municipalizar |
| BCB-RENDA | https://dadosabertos.bcb.gov.br/dataset/29034-comprometimento-de-renda-das-familias-com-o-servico-da-divida-com-o-sistema-financeiro-nacion | Brasil | Mensal, conforme série | Contexto macro; não municipalizar |
| PEIC | https://portaldocomercio.org.br/tab-publicacao/peic/ | Nacional; coleta nas capitais/DF | Mensal | Publicações e metodologia confirmadas; série local e download estruturado a verificar |
| IPDC | https://www.fecomercio-ce.com.br/ | Fortaleza | Mensal | Pesquisa de endividamento; publicações confirmadas; acesso a tabelas/histórico a validar |
| PNAD | https://www.ibge.gov.br/estatisticas/sociais/trabalho/9173-pnadcontinua.html | Brasil, UF e capitais conforme indicador | Trimestral/anual | Tabelas SIDRA no MVP; não todos os municípios |
| CENSO | https://servicodados.ibge.gov.br/api/v3/agregados/4714/periodos/2022/variaveis/93?localidades=N6[N3[23]] | 184 municípios do Ceará; população residente | Censo 2022 | Contexto municipal observado; códigos conferidos contra Localidades |
| CENSO-RENDA | https://sidra.ibge.gov.br/tabela/10295 | 184 municípios do Ceará; rendimento domiciliar per capita médio e mediano | Censo 2022 | Valores nominais mensais observados; totais de sexo, cor ou raça e idade; universo e exclusões preservados no manifesto |
| GEO | https://servicodados.ibge.gov.br/api/v3/malhas/estados/23?formato=application/vnd.geo+json&qualidade=minima&intrarregiao=municipio | 184 municípios do Ceará | Snapshot consultado em 06/11/2026 | GeoJSON de qualidade mínima para visão estadual; todos os `codarea` conferidos contra o cadastro; não usar para medição de precisão |
| LOCAL | https://servicodados.ibge.gov.br/api/v1/localidades/estados/23/municipios?orderBy=nome | Cadastro municipal CE | Cadastro | 184 municípios e códigos validados; lista territorial canônica; não é indicador de dívida |
| CAGED | https://www.gov.br/trabalho-e-emprego/pt-br/assuntos/estatisticas-trabalho/perfil-do-municipio | Municípios; emprego formal; metodologia Novo Caged desde 2020 | Mensal | Competência 08/2026 confirmada; série ajustada, revisões e leiaute ainda serão fixados antes da ingestão |
| CONSUMIDOR | https://www.consumidor.gov.br/pages/conteudo/publico/62 | UF/município do consumidor conforme registro | Registros administrativos | Complementar; dados abertos e consultas confirmados, schema a baixar |
| SERASA | https://www.serasa.com.br/limpa-nome-online/blog/mapa-da-inadimplencia-e-renogociacao-de-dividas-no-brasil/ | Brasil/UF e recortes publicados | Relatórios por edição | Complementar; série municipal aberta completa não confirmada |
| POF | https://www.ibge.gov.br/estatisticas/sociais/populacao/9050-pesquisa-de-orcamentos-familiares.html | Brasil/UF conforme edição/tabela | Edições | Contexto histórico 2017–2018; não retrato mensal atual |
| ESTBAN | https://www.bcb.gov.br/estatisticas/estatisticabancariamunicipios?modalAberto=baixar-arquivos | Municípios/agências | Mensal | Só contexto bancário. Saldos contábeis por município não medem dívida dos residentes |
| MDCR | https://dadosabertos.bcb.gov.br/dataset/matrizdadoscreditorural | Municípios; contratos rurais | Mensal | Capítulo rural opcional; contratação não é inadimplência geral das famílias |

## Acesso reprodutível ao SCR.data

A metodologia v2 informa arquivos anuais em `https://www.bcb.gov.br/pda/desig/scrdata_{ANO}.zip`, contendo CSVs mensais separados por ponto e vírgula. O caminho é documentado; cada ano/mês deve ser confirmado na coleta. Não presumir que o mês mais recente do calendário já foi publicado.

## Consulta técnica do serviço sub-regional

Metadados: `https://olinda.bcb.gov.br/olinda/servico/scr_sub_regiao/versao/v1/odata/$metadata`.

Função: `scr_sub_regiao(DataBase=@DataBase)`; parâmetro inteiro no formato AAAAMM. Uma consulta com `@DataBase=202608`, filtro `ESTADO eq 'CE'`, `$top=1000` e `$format=json` retornou 62 linhas. Os códigos de sub-região observados foram 60, 61, 62 e 63. O retorno é uma amostra de competência para validar schema e cobertura, não uma correspondência geográfica oficial.

A consulta filtrada funcionou com o valor textual corretamente codificado. A documentação consultada não forneceu tabela de correspondência entre os códigos observados e municípios; por isso a fase 00 decidiu não usar `SUB_REGIAO` na escala municipal.

Campos observados: DATA_BASE, CLIENTE, ESTADO, SUB_REGIAO, MODALIDADE, RISCO, OPERACOES, CARTEIRA, faixas a vencer e VENCIDO_ACIMA_DE_15_DIAS. `RISCO` nulo em linhas da amostra. Não inventar classificações ausentes.

## Registro por arquivo coletado

Salvar: source_id, URL exata, consultado_em, competencia_inicial/final, unidade, geografia, licença/termos, versão, hash SHA256, quantidade de linhas, paginação e revisões. Não usar página de notícia como substituto de uma série sem registrar a extração e a conferência.
