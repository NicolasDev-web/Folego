# Análise das cidades: requisito e condições

## Decisão — opção B

Em 06/11/2026 foi escolhida a opção B: incluir o explorador dos municípios do Ceará desde o MVP, com contexto oficial e cobertura transparente. Indicadores de dívida e atraso municipais só entram quando houver fonte direta e documentação territorial. Até lá, o produto mostra população observada, prepara renda e emprego formal, mantém dívida municipal indisponível e direciona a análise de crédito para a escala estadual compatível.

Evidências, critérios e janela temporal: `RELATORIO_VIABILIDADE.md`. Arquivos e hashes: `../metadata/phase00_manifest.json`. Matriz do piloto: `../data/processed/coverage_matrix.csv`.

## O que está demonstrado

| Informação | Escala demonstrada | Condição |
|---|---|---|
| Carteira e inadimplência do SCR.data | Estado | Confirmada pela documentação |
| Carteira e vencido >15 dias do serviço sub-regional | Código de sub-região + UF | Amostra e schema confirmados; correspondência territorial pendente |
| População censitária | Município | Censo 2022 validado para os 184 códigos do Ceará |
| Renda censitária | Município | Fonte demonstrada; tabela, universo e unidade ainda serão fixados |
| Emprego formal | Município | Fonte MTE e competência 08/2026 confirmadas; definir série ajustada e revisões |
| Reclamações | Município conforme registro | Schema e completude a validar; representa a plataforma |
| Percentual de pessoas negativadas em todas as cidades CE | Não demonstrado | Procurar publicação ou acesso autorizado; sem promessa de disponibilidade |
| PEIC/IPDC | Capitais/Fortaleza conforme pesquisa | Não extrapolar a todo o estado |

## Portão de liberação municipal

Uma métrica municipal de dívida só é liberada quando os seis itens forem verdadeiros:

1. A fonte identifica município por código ou correspondência oficial verificável.
2. A localização significa o que a interface afirma (residência, agência, contrato ou estabelecimento).
3. Numerador, denominador, unidade e conceito estão documentados.
4. A competência e a cobertura de municípios são conhecidas.
5. Há política para supressão, confidencialidade, revisões e ausência de dado.
6. O uso e a redistribuição do agregado estão compatíveis com a fonte.

## Roteiro de validação

A busca documental não encontrou correspondência oficial pública que permita transformar os códigos SUB_REGIAO 60–63 em municípios ou regiões nomeadas. Eles permanecem separados e nunca são convertidos em código IBGE por suposição. A verificação de fontes diretas municipais não demonstrou uma série pública completa que passe pelos seis critérios. Futuras solicitações de informação ou parceria só serão preparadas com instrução do usuário.

Piloto territorial: Fortaleza, Caucaia, Maracanaú, Sobral, Juazeiro do Norte, Crato, Iguatu e Quixadá. A seleção serve para testar cobertura e UX, não é amostra representativa do Ceará. A lista definitiva de municípios vem do IBGE.

## Duas entregas possíveis, com a mesma navegação

**Se houver dado direto municipal:** mapa de carteira ou atraso com conceito correspondente, ficha, comparação e fonte. Não chamar saldo vencido >15 dias de taxa de inadimplência >90 dias.

**Se não houver dado direto municipal:** mapa de contexto (renda censitária, população e emprego formal compatível), ficha municipal e bloco regional separado. A opção de dívida municipal aparece indisponível com explicação. O resultado estadual continua acessível, sem ser atribuído ao município.

Ambos os caminhos incluem cidades. O segundo tem uma limitação explícita para a pergunta de endividamento local; não deve ser vendido como levantamento municipal completo de inadimplência.

## Interface de cobertura

Cada município/indicador terá estado: observado, parcial, suprimido, indisponível ou não aplicável. Cinza/hachura identifica ausência; zero usa a escala numérica. A lista e a tabela oferecem as mesmas funções do mapa. Ranking só inclui observações elegíveis e mostra quantas cidades ficaram fora.

Comparar municípios apenas no mesmo indicador, universo, período e versão. Não colocar uma pesquisa de Fortaleza e um saldo bancário de Sobral na mesma classificação.
