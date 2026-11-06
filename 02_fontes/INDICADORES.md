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
| renda_censo | Rendimento definido pela tabela IBGE | Média/mediana publicada | R$ e ano-base | Município | Foto censitária; não renda mensal atual |
| emprego_saldo | Saldo de vínculos formais | Admissões - desligamentos | Vínculos | Município | Trabalho formal e local do estabelecimento |
| reclamacoes_fin | Reclamações financeiras registradas | Contagem após regras de categoria/deduplicação | Registros | Município/UF | Não prevalência de endividamento |
| comprometimento_br | Serviço da dívida / renda | Definição da série BC selecionada | % | Brasil | Manter ajuste sazonal e média móvel documentados |

Na fase 00, preencher tabela de origem real dos campos, unidades e chaves. Os identificadores acima são internos propostos; não são nomes de campos garantidos de todas as APIs.

Toda série precisa de: descrição, fonte, geografia, universo, data, unidade, regra de agregação, versão metodológica e restrição de comparabilidade. Não calcular métrica se algum requisito essencial estiver pendente.
