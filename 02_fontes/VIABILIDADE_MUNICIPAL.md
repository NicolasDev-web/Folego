# Análise das cidades: requisito e condições

## Decisão

Incluir o explorador dos municípios do Ceará desde o MVP. Indicadores de dívida e atraso municipais só entram quando houver fonte direta e documentação territorial. Contexto socioeconômico e disponibilidade dos dados já têm espaço definido na experiência.

## O que está demonstrado

| Informação | Escala demonstrada | Condição |
|---|---|---|
| Carteira e inadimplência do SCR.data | Estado | Confirmada pela documentação |
| Carteira e vencido >15 dias do serviço sub-regional | Código de sub-região + UF | Amostra e schema confirmados; correspondência territorial pendente |
| Renda e população censitárias | Município | Tabelas e malha oficiais; escolher tabela e validar extração |
| Emprego formal | Município | Fontes MTE disponíveis; definir série e ajustes |
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

Primeiro, resolver os códigos SUB_REGIAO no BC e verificar se representam grupos territoriais. Não converter esses códigos em código IBGE municipal. Segundo, procurar tabelas públicas municipais nos relatórios dos cadastros de crédito; acesso a painel não significa direito a extrair todos os dados. Terceiro, avaliar pedidos de informação ou parceria somente se necessários: preparar uma minuta local, sem enviar mensagem sem instrução do usuário.

Piloto territorial: Fortaleza, Caucaia, Maracanaú, Sobral, Juazeiro do Norte, Crato, Iguatu e Quixadá. A seleção serve para testar cobertura e UX, não é amostra representativa do Ceará. A lista definitiva de municípios vem do IBGE.

## Duas entregas possíveis, com a mesma navegação

**Se houver dado direto municipal:** mapa de carteira ou atraso com conceito correspondente, ficha, comparação e fonte. Não chamar saldo vencido >15 dias de taxa de inadimplência >90 dias.

**Se não houver dado direto municipal:** mapa de contexto (renda censitária, população e emprego formal compatível), ficha municipal e bloco regional separado. A opção de dívida municipal aparece indisponível com explicação. O resultado estadual continua acessível, sem ser atribuído ao município.

Ambos os caminhos incluem cidades. O segundo tem uma limitação explícita para a pergunta de endividamento local; não deve ser vendido como levantamento municipal completo de inadimplência.

## Interface de cobertura

Cada município/indicador terá estado: observado, parcial, suprimido, indisponível ou não aplicável. Cinza/hachura identifica ausência; zero usa a escala numérica. A lista e a tabela oferecem as mesmas funções do mapa. Ranking só inclui observações elegíveis e mostra quantas cidades ficaram fora.

Comparar municípios apenas no mesmo indicador, universo, período e versão. Não colocar uma pesquisa de Fortaleza e um saldo bancário de Sobral na mesma classificação.
