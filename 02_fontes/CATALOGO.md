# Catálogo de fontes e decisões

Verificação documental em 05/11/2026. “Confirmado” refere-se à documentação ou à consulta indicada, não a uma ingestão histórica completa. Licenças, termos, denominadores e datas finais serão registrados na fase 00.

| ID | Fonte e acesso | Cobertura útil | Frequência | Uso e estado |
|---|---|---|---|---|
| BCB-SCR | https://dadosabertos.bcb.gov.br/dataset/scr_data | UF e Brasil; renda/ocupação/modalidade | Mensal | Núcleo; documentação consultada. Arquivos anuais ZIP/CSV; histórico a baixar |
| BCB-SUB | https://dadosabertos.bcb.gov.br/dataset/scr-por-sub-regiao | UF + código de sub-região | Mensal | Metadados e amostra consultados; geografia, unidade monetária e continuidade a resolver |
| BCB-RENDA | https://dadosabertos.bcb.gov.br/dataset/29034-comprometimento-de-renda-das-familias-com-o-servico-da-divida-com-o-sistema-financeiro-nacion | Brasil | Mensal, conforme série | Contexto macro; não municipalizar |
| PEIC | https://portaldocomercio.org.br/tab-publicacao/peic/ | Nacional; coleta nas capitais/DF | Mensal | Publicações e metodologia confirmadas; série local e download estruturado a verificar |
| IPDC | https://www.fecomercio-ce.com.br/ | Fortaleza | Mensal | Pesquisa de endividamento; publicações confirmadas; acesso a tabelas/histórico a validar |
| PNAD | https://www.ibge.gov.br/estatisticas/sociais/trabalho/9173-pnadcontinua.html | Brasil, UF e capitais conforme indicador | Trimestral/anual | Tabelas SIDRA no MVP; não todos os municípios |
| CENSO | https://www.ibge.gov.br/estatisticas/sociais/populacao/22827-censo-demografico-2022.html?edicao=44663 | Municípios; renda e trabalho conforme tabela | Censitária | Contexto municipal; resultados preliminares da amostra têm notas específicas |
| GEO | https://www.ibge.gov.br/geociencias/todos-os-produtos-geociencias/15774-malhas.html | Municípios e demais territórios oficiais | Edição da malha | Base cartográfica; controlar versão e códigos |
| LOCAL | https://servicodados.ibge.gov.br/api/v1/localidades/estados/23/municipios | Cadastro municipal CE | Cadastro | Consulta técnica para lista/códigos; não indicador de dívida |
| CAGED | https://www.gov.br/trabalho-e-emprego/pt-br/assuntos/estatisticas-trabalho | Municípios; emprego formal | Mensal/anual conforme base | Novo Caged e RAIS; validar séries ajustadas e mudanças de método |
| CONSUMIDOR | https://www.consumidor.gov.br/pages/conteudo/publico/62 | UF/município do consumidor conforme registro | Registros administrativos | Complementar; dados abertos e consultas confirmados, schema a baixar |
| SERASA | https://www.serasa.com.br/limpa-nome-online/blog/mapa-da-inadimplencia-e-renogociacao-de-dividas-no-brasil/ | Brasil/UF e recortes publicados | Relatórios por edição | Complementar; série municipal aberta completa não confirmada |
| POF | https://www.ibge.gov.br/estatisticas/sociais/populacao/9050-pesquisa-de-orcamentos-familiares.html | Brasil/UF conforme edição/tabela | Edições | Contexto histórico 2017–2018; não retrato mensal atual |
| ESTBAN | https://www.bcb.gov.br/estatisticas/estatisticabancariamunicipios?modalAberto=baixar-arquivos | Municípios/agências | Mensal | Só contexto bancário. Saldos contábeis por município não medem dívida dos residentes |
| MDCR | https://dadosabertos.bcb.gov.br/dataset/matrizdadoscreditorural | Municípios; contratos rurais | Mensal | Capítulo rural opcional; contratação não é inadimplência geral das famílias |

## Acesso reprodutível ao SCR.data

A metodologia v2 informa arquivos anuais em `https://www.bcb.gov.br/pda/desig/scrdata_{ANO}.zip`, contendo CSVs mensais separados por ponto e vírgula. O caminho é documentado; cada ano/mês deve ser confirmado na coleta. Não presumir que o mês mais recente do calendário já foi publicado.

## Consulta técnica do serviço sub-regional

Metadados: `https://olinda.bcb.gov.br/olinda/servico/scr_sub_regiao/versao/v1/odata/$metadata`.

Função: `scr_sub_regiao(DataBase=@DataBase)`; parâmetro inteiro no formato AAAAMM. Uma consulta pública sem filtro com `@DataBase=202508`, `$top=1000`, `$format=json` retornou 1000 linhas. É amostra parcial e não totaliza a base. Códigos de sub-região observados para CE: 60, 61, 62 e 63; isso não assegura lista completa.

O filtro `ESTADO eq 'CE'` recebeu HTTP 400 com erro de tipos do serviço nesta sessão. O plano não depende desse filtro: testar sintaxe no construtor oficial ou paginar a consulta sem filtro, respeitando limites. Não insistir em supor que um retorno parcial é universo completo.

Campos observados: DATA_BASE, CLIENTE, ESTADO, SUB_REGIAO, MODALIDADE, RISCO, OPERACOES, CARTEIRA, faixas a vencer e VENCIDO_ACIMA_DE_15_DIAS. `RISCO` nulo em linhas da amostra. Não inventar classificações ausentes.

## Registro por arquivo coletado

Salvar: source_id, URL exata, consultado_em, competencia_inicial/final, unidade, geografia, licença/termos, versão, hash SHA256, quantidade de linhas, paginação e revisões. Não usar página de notícia como substituto de uma série sem registrar a extração e a conferência.
