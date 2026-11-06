# Como vamos investigar o endividamento

## 1. O contexto da aplicação

O projeto investiga o espaço entre ter acesso a crédito e ter dificuldade para pagar compromissos. Uma dívida pode financiar moradia ou atividade produtiva; também pode acompanhar um orçamento pressionado. A investigação precisa verificar o que os dados sustentam, sem presumir de antemão que todo crescimento do crédito representa piora social.

O público principal é uma pessoa curiosa sobre sua cidade, sem formação em economia. Jornalistas, estudantes e pesquisadores terão acesso às mesmas visualizações com definições, exportação e fontes detalhadas. O produto combina narrativa guiada e exploração livre.

## 2. Quatro conceitos diferentes

| Conceito | Explicação | O que a medida não revela sozinha |
|---|---|---|
| Ter dívida | Possuir um compromisso a pagar, inclusive em dia | Se a família está em dificuldade |
| Atraso | Pagamento vencido segundo a regra de cada fonte | Um percentual universal comparável entre fontes |
| Comprometimento de renda | Pagamentos de dívida em relação à renda definida na metodologia | A incidência de endividados na população |
| Endividamento de risco / superendividamento | Situações graves, com critérios próprios | Uma classificação que possamos reproduzir com qualquer dado agregado |

Exemplo hipotético: uma família com financiamento em dia é endividada; outra com conta vencida pode aparecer numa pesquisa ou cadastro de negativação. Os percentuais de famílias, pessoas negativadas e saldos de operações são medidas distintas. Não vamos somá-los nem apresentá-los como a mesma taxa.

## 3. O que cada fonte observa

O SCR.data descreve operações reportadas ao BC e publica agregados por UF. Sua taxa de inadimplência considera o valor da carteira das operações com alguma parcela em atraso superior a 90 dias, dividido pela carteira total do recorte. Não é somente a parcela atrasada nem a porcentagem de pessoas inadimplentes.

A PEIC registra respostas de consumidores sobre suas famílias. A coleta ocorre nas capitais e no Distrito Federal. O resultado de uma capital exige o rótulo daquela capital; o agregado nacional deve seguir a metodologia de ponderação da própria pesquisa.

A pesquisa IPDC/Fecomércio-CE é local de Fortaleza. Comparabilidade com a PEIC exige conferir universo, perguntas, denominadores e período. Uma publicação de imprensa com dois percentuais diferentes não autoriza concluir que uma pesquisa está errada.

A Serasa observa seu cadastro e publica relatórios. Não temos confirmada neste pacote uma série pública estruturada com cobertura de todos os municípios cearenses. Ela é complementar e condicionada ao acesso e à metodologia.

PNAD contextualiza renda e trabalho; Censo contextualiza municípios; Consumidor.gov descreve reclamações. Nenhuma dessas fontes mede automaticamente a dívida de todos os moradores de uma cidade.

## 4. Ceará e cidades: uma regra de honestidade geográfica

O município pode ter população, renda censitária e reclamações disponíveis e, ao mesmo tempo, não ter uma taxa pública validada de endividamento. A ficha municipal deve explicar essa diferença e continuar útil.

O SCR por sub-região foi consultado tecnicamente. O esquema retorna `ESTADO` e `SUB_REGIAO`, sem campo municipal. Uma amostra de agosto/2025 contém códigos de sub-região do Ceará. Não foi resolvida a correspondência territorial desses códigos nesta entrega. Isso NÃO demonstra cobertura municipal. A tarefa inicial é obter a tabela territorial oficial e verificar a unidade efetiva.

O campo `VENCIDO_ACIMA_DE_15_DIAS` desse serviço não reproduz a taxa de inadimplência superior a 90 dias do SCR.data. Valores e unidades precisam ser confirmados na documentação antes do cálculo. `RISCO` veio nulo na amostra consultada e não deve ser convertido em categoria ou nota.

Nunca repartir crédito de uma sub-região entre cidades por população e chamar isso de dívida observada. Se uma estatística regional for mostrada dentro da ficha municipal, apresentar bloco separado: “Contexto da sub-região”, com seu contorno e nome oficial.

## 5. Perguntas de pesquisa

1. O saldo de crédito PF e sua inadimplência mudaram no Ceará em relação ao Brasil e ao Nordeste?
2. Quais modalidades e faixas de renda apresentam trajetórias distintas?
3. O que as pesquisas revelam sobre atrasos e capacidade declarada de pagamento em Fortaleza e no Brasil?
4. Que diferenças municipais são observáveis diretamente e quais permanecem sem cobertura?
5. Como renda, emprego formal e contexto demográfico se relacionam com os indicadores disponíveis?

Hipóteses para testar, não conclusões: modalidades de crédito têm perfis de atraso distintos; a composição da carteira muda o indicador agregado; renda e mercado de trabalho podem acompanhar a trajetória do atraso; municípios têm coberturas diferentes que afetam comparações.

## 6. Da fonte ao gráfico

1. Registrar URL, data de acesso, licença/termos, formato e versão metodológica.
2. Baixar arquivo ou consultar API pública com paginação; manter cópia bruta e hash.
3. Identificar unidade da linha, dimensões, unidade monetária e conceito de cada campo.
4. Verificar duplicatas, faltantes, revisões, supressões e cobertura temporal/geográfica.
5. Normalizar geografia por código IBGE quando houver correspondência oficial.
6. Calcular indicadores apenas em recortes compatíveis.
7. Publicar dados agregados com metadados e explicações próximas do gráfico.
8. Escrever conclusões após conferir os resultados. Cada afirmação terá tabela e transformação rastreáveis.

## 7. Como calcular e comparar

- Variação em 12 meses: `(saldo_t / saldo_t-12 - 1) × 100`, se ambos existirem e a base anterior for positiva.
- Participação de modalidade: saldo da modalidade / saldo total do mesmo universo, mês e território.
- Inadimplência agregada: somar numeradores elegíveis e dividir pela soma das carteiras compatíveis; não tirar média simples das taxas.
- Saldo por operação: carteira / número de operações. Não é dívida média por pessoa e não é tíquete de novas concessões.
- Saldo por habitante: saldo do território / população compatível. Inclui moradores sem dívida no denominador; não expressa o valor devido por cada morador.
- Taxas percentuais mudam em pontos percentuais: de 4% para 5% = +1 p.p., não +1%.
- Séries de estoque não devem ser somadas ao longo dos meses para representar concessões anuais.
- Se a fonte trouxer valores em milhares de reais, converter explicitamente para reais. Não inferir unidade pela magnitude dos números.
- Valores monetários históricos: permitir nominal e real apenas com deflator documentado, base de preços explícita e datas coerentes.

## 8. Período de análise

Proposta inicial: 2019 até a última competência efetivamente disponível por fonte. A fase 00 pode reduzir a janela comum para evitar incompatibilidades. Cada painel mostra seu próprio período, e a comparação sincronizada usa somente a interseção disponível. Dados parciais de 2026 são comparados com os mesmos meses de outros anos, quando fizer sentido.

Não há uma única “data de atualização” que represente todas as fontes. Exibir competência do dado e data de coleta separadamente. A amostra técnica de agosto/2025 serve somente para inspeção de estrutura.

## 9. Quebras metodológicas e limites

O SCR alterou o limite de identificação de R$ 1.000 para R$ 200 em junho/2016. A metodologia da versão 2 informa mudança no critério de ativos problemáticos a partir de janeiro/2025. Não ligar segmentos incompatíveis como se fossem uma série homogênea. Conferir também transições entre versões dos arquivos.

Faixas em salários mínimos mudam sua equivalência monetária e composição ao longo do tempo. Renda censitária de 2022 continua sendo uma fotografia daquele ano; corrigi-la monetariamente não a transforma em renda municipal atual.

PNAD requer pesos e desenho amostral para inferência com microdados; usar tabelas oficiais no MVP. Não produzir desemprego mensal para todos os municípios. Novo Caged cobre vínculos formais e local de trabalho; não toda a população ocupada nem necessariamente sua residência.

Reclamações têm seleção de usuários e cobertura de empresas. Mais reclamações podem acompanhar maior uso da plataforma. Não são taxa de endividamento. Percentuais de amostras precisam de denominador e, quando disponíveis, informações de precisão. Ausência de dado não é zero.

Associações agregadas não demonstram que a pessoa sem emprego é a mesma pessoa inadimplente. Correlação temporal também pode refletir tendências comuns. Não publicar causalidade, previsão individual de crédito ou diagnóstico pessoal a partir deste projeto.

## 10. O que será apresentado ao público

Uma narrativa com perguntas claras; mapa municipal por indicadores efetivamente cobertos; ficha de cidade; comparação territorial compatível; evolução temporal; perfil das dívidas; capítulo sobre renda e trabalho; metodologia em duas camadas, resumo simples e nota técnica completa.

Se a fonte municipal de dívida não for validada, a aplicação mostrará o mapa de contexto socioeconômico e o crédito em sua escala real. A pendência ficará visível. O usuário poderá explorar cidades sem receber números inventados de endividamento.

## Leituras e fontes

- BC, metodologia SCR.data v2: https://www.bcb.gov.br/pda/desig/metodologia_versao2.pdf
- BC, catálogo SCR: https://dadosabertos.bcb.gov.br/dataset/scr_data
- BC, sub-região: https://dadosabertos.bcb.gov.br/dataset/scr-por-sub-regiao
- CNC, metodologia PEIC: https://pesquisascnc.com.br/sobre-3/
- IBGE, PNAD: https://www.ibge.gov.br/estatisticas/sociais/trabalho/9173-pnadcontinua.html
- IBGE, Censo: https://www.ibge.gov.br/estatisticas/sociais/populacao/22827-censo-demografico-2022.html
- Consumidor.gov: https://www.consumidor.gov.br/pages/conteudo/publico/62
