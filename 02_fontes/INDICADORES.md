# Contrato semântico dos indicadores

| ID | Medida | Numerador / denominador | Unidade | Escala inicial | Restrições |
|---|---|---|---|---|---|
| carteira_pf | Saldo de crédito PF | Soma de `carteira_ativa` elegível no mês | R$ (nominal e real IPCA `2026-09`) | UF/Região/Brasil | Estoque; não somar meses |
| inad90_carteira | Inadimplência SCR.data | `carteira_inadimplencia` (>90 dias) / `carteira_ativa` | % | UF/Região/Brasil | Ponderação por carteira; não pessoas |
| saldo_operacao | Saldo por operação | `carteira_ativa` de linhas visíveis / `numero_de_operacoes` visíveis (`> 0`) | R$/operação | Mesma origem da carteira | Operações `<= 15` mascaradas como `-1` (`suprimido`); não é dívida por pessoa |
| participacao_modalidade | Composição da carteira | `carteira_ativa` da modalidade / `carteira_ativa` do universo | % | UF/Região/Brasil | Soma disjunta das modalidades fecha 100%; não somar total com subtotais |
| vencido15_sub | Saldo vencido acima de 15 dias | `VENCIDO_ACIMA_DE_15_DIAS` / `CARTEIRA` na sub-região postal | % (e valor bruto `Edm.Decimal`) | Sub-região (`60..63`) | Sempre `status: parcial`; não habilitar como `inad90` nem municipalizar |
| consumidores_endividados_ipdc | Consumidores com dívidas declaradas | Proporção entre consumidores pesquisados | % | IPDC Fortaleza | Novembro de 2025 recuperado na tabela histórica oficial |
| familias_endividadas | Famílias com dívidas declaradas | Famílias endividadas / total de famílias pesquisadas | % | PEIC nacional (`BR`) | Denominador: famílias pesquisadas |
| familias_atraso | Famílias com atraso declarado | Famílias com contas em atraso / total de famílias pesquisadas | % | Pesquisa nacional (`BR`) / capital (`Fortaleza`) | Critério amostral difere do SCR (`> 90 dias`) |
| renda_censo | Rendimento nominal mensal domiciliar per capita | Média (`13431`) e mediana (`13534`) da tabela SIDRA 10295, totais de sexo, cor ou raça e idade | R$ nominais de 2022 | Município / UF / Região / Brasil | Foto censitária; universo exclui pensionistas, empregados domésticos e seus parentes; não é renda mensal atual |
| emprego_saldo | Saldo mensal de vínculos formais | Admissões menos desligamentos (`CAGEDMOV202609` sem ajustes e Tabelas Ajustadas `2020-01..2026-08`) | Vínculos | Município do estabelecimento / UF / Região / Brasil | Novo Caged desde 2020; distinguir retrato corrente sem ajustes vs. série ajustada |
| emprego_ocupacao_saldo | Saldo mensal por ocupação | Mesma regra de saldo, agrupada por CBO 2002 | Vínculos | Município do estabelecimento e ocupação | Títulos vêm do dicionário oficial; não representa estoque de pessoas empregadas |
| emprego_setor_movimentos | Movimentações por setor | Admissões + desligamentos agrupados pela seção CNAE 2.0 | Movimentos | Município do estabelecimento e setor | Mede volume de entradas e saídas, não crescimento líquido |
| salario_medio_admissao | Salário médio nominal das admissões | Média simples dos salários positivos nas linhas com `saldomovimentação = 1` | R$ nominais | Município do estabelecimento | Não é renda média de todos os trabalhadores nem salário real |
| taxa_desocupacao_pnad | Taxa de desocupação trimestral | Variável `4099` acompanhada do CV (`4103`) na tabela SIDRA 4099 | % | Brasil / Nordeste / Ceará / Fortaleza | Estimativa amostral trimestral; exibir CV junto à série |
| rendimento_habitual_real_pnad | Rendimento médio real habitual | Variável `5933` acompanhada do CV (`5941`) na tabela SIDRA 6472 | R$ | Brasil / Nordeste / Ceará / Fortaleza | Estimativa amostral trimestral; exibir CV junto à série |
| comprometimento_br | Serviço da dívida / renda | Série `SGS 29034` do Banco Central | % | Brasil | Manter ajuste sazonal documentado; não municipalizar |

Origem validada e implementada em `pipeline/transform/indicators.py` e `pipeline/validate/export_public.py`, com cobertura de testes em `pipeline/tests/test_phase02.py` e relatório de reconciliação em `02_fontes/RELATORIO_QUALIDADE_DADOS.md`.
