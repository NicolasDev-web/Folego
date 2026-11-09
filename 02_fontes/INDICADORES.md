# Contrato semântico dos indicadores

| ID | Medida | Numerador / denominador | Unidade | Escala inicial | Restrições |
|---|---|---|---|---|---|
| carteira_pf | Saldo de crédito PF | Soma dos saldos elegíveis no mês | R$ após conversão validada | UF/Brasil | Estoque; não somar meses |
| inad90_carteira | Inadimplência SCR.data | Carteira das operações com parcela >90 dias / carteira total | % | UF/Brasil | Ponderação por carteira; não pessoas |
| saldo_operacao | Saldo por operação | Carteira / operações | R$/operação | Mesma origem da carteira | Não dívida por pessoa |
| participacao_modalidade | Composição da carteira | Carteira modalidade / carteira universo | % | UF/Brasil | Não somar total com subtotais |
| vencido15_sub | Saldo vencido acima de 15 dias | Campo próprio do serviço | Unidade fonte a confirmar | Sub-região | Não habilitar como inad90 |
| familias_endividadas | Famílias com dívidas declaradas | Definição da pesquisa | % | Pesquisa nacional/capital | Denominador e ponderação da edição |
| familias_atraso | Famílias com atraso declarado | Definição da pesquisa | % | Pesquisa nacional/capital | Critério difere do SCR |
| renda_censo | Rendimento nominal mensal domiciliar per capita | Média e mediana da tabela SIDRA 10295, totais de sexo, cor ou raça e idade | R$ nominais de 2022 | Município | Foto censitária; universo exclui pensionistas, empregados domésticos e seus parentes; não é renda mensal atual |
| emprego_saldo | Saldo mensal de vínculos formais | Contagem de `saldomovimentação = 1` menos contagem de `saldomovimentação = -1` | Vínculos | Município do estabelecimento | Novo Caged desde 2020; a competência publicada não inclui ajustes declarados posteriormente |
| emprego_ocupacao_saldo | Saldo mensal por ocupação | Mesma regra de saldo, agrupada por CBO 2002 | Vínculos | Município do estabelecimento e ocupação | Títulos vêm do dicionário oficial; não representa estoque de pessoas empregadas |
| emprego_setor_movimentos | Movimentações por setor | Admissões + desligamentos agrupados pela seção CNAE 2.0 | Movimentos | Município do estabelecimento e setor | Mede volume de entradas e saídas, não crescimento líquido |
| salario_medio_admissao | Salário médio nominal das admissões | Média simples dos salários positivos nas linhas com `saldomovimentação = 1` | R$ nominais | Município do estabelecimento | Não é renda média de todos os trabalhadores nem salário real |
| reclamacoes_fin | Reclamações financeiras registradas | Contagem após regras de categoria/deduplicação | Registros | Município/UF | Não prevalência de endividamento |
| comprometimento_br | Serviço da dívida / renda | Definição da série BC selecionada | % | Brasil | Manter ajuste sazonal e média móvel documentados |

Origem validada de `renda_censo`: variáveis 13431 (média) e 13534 (mediana), período 2022 e nível N6. Os demais identificadores continuam internos e devem ser ligados aos campos reais antes da publicação.

Toda série precisa de: descrição, fonte, geografia, universo, data, unidade, regra de agregação, versão metodológica e restrição de comparabilidade. Não calcular métrica se algum requisito essencial estiver pendente.
