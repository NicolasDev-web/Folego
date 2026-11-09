# Registro de decisões

| ID | Decisão | Razão | Rever quando |
|---|---|---|---|
| D01 | Nome provisório Fôlego | Identidade humana ligada ao orçamento | Definição de marca |
| D02 | Verde petróleo/areia/terracota | Personalização da referência | Testes visuais e de contraste |
| D03 | Sem índice composto de superendividamento no MVP | Agregados não sustentam diagnóstico individual | Métrica validada e objetivo explícito |
| D04 | Municípios como requisito; dívida local condicionada à fonte | Cobertura direta ainda não demonstrada | Fase 00 |
| D05 | SCR sub-regional separado do SCR.data | Geografia, campos e conceitos diferentes | Documentação completa |
| D06 | React/TS/Vite + pipeline Python propostos | Componentes, tipos e publicação estática | Restrições do ambiente de implementação |
| D07 | Dados pré-agregados no frontend | Leveza, estabilidade e reprodutibilidade | Volume real |
| D08 | UX antecede implementação completa dos gráficos | Prioridade expressa do usuário | Sem alteração prevista |
| D09 | Iniciar o frontend com fixture apenas de cobertura indisponível | Permite validar jornada sem publicar números demonstrativos como achados | Quando a fase 02 entregar agregados validados |
| D10 | Persistir a seleção municipal em query string | Link compartilhável, recarga reproduzível e ausência de dado pessoal | Quando novos filtros públicos forem adicionados |
| D11 | Adotar a opção B no MVP municipal: contexto oficial, dívida local indisponível e análise de crédito na escala compatível | A fase 00 validou os 184 municípios e a população de 2022, mas não demonstrou fonte pública direta de dívida municipal nem correspondência oficial dos códigos SUB_REGIAO 60–63 | Quando uma fonte direta passar pelos seis critérios ou houver correspondência territorial oficial |
| D12 | Usar a malha municipal do IBGE como mapa de contexto, sem escala temática de dívida | A geometria situa cada cidade e sincroniza a navegação, enquanto a ausência de indicador municipal impede uma codificação quantitativa honesta | Quando houver indicador municipal elegível e legenda correspondente |
| D13 | Fazer do mapa a superfície principal, com busca compacta e ficha lateral única | A lista permanente e os cartões fragmentados escondiam o território, repetiam conteúdo e alongavam excessivamente a experiência móvel | Após testes de uso ou quando novos indicadores exigirem controles adicionais |
| D14 | Usar `#174440` como campo do mapa, mostrar o nome selecionado sobre ele e impedir reset de rolagem na troca de município | Preferência visual e de interação confirmada pelo usuário; a seleção deve manter o contexto espacial e a posição de leitura | Se testes de contraste ou uso indicarem dificuldade |
| D15 | Extrair SCR.data via HTTP Range nos diretórios centrais ZIP + agregação DuckDB em cache mensal | Permite auditar os 93 CSVs mensais (2019–2026) por CRC32/SHA-256 e agregar 33 competências completas (~3,3 GB brutos) com reexecução determinística em segundos | Se o BCB alterar o empacotamento ZIP dos dados abertos |
| D16 | Tratar saldos do SCR.data v2 em Reais (`R$`) e manter `BCB-SUB` em unidade da fonte (`Edm.Decimal`) com indicador percentual `vencido15_sub` (`status: parcial`) | Reconciliação com `SGS 20541` comprovou que `scrdata_AAAAMM.csv` já está em `R$`, enquanto `$metadata` Olinda não documenta fator de milhar em `scr_sub_regiao` | Se o BCB atualizar o `$metadata` do serviço `scr_sub_regiao` |
| D17 | Preservar `2025-11` como `null` (`indisponivel`) na série do IPDC Fortaleza e separar `capital_pesquisa` (`2304400`) de `municipio` e `UF` | Ausência de boletim mensal publicado pela Fecomércio-CE para novembro/2025; regra inegociável proíbe interpolar ou converter ausência em zero | Se a Fecomércio-CE publicar tabela histórica retroativa contendo nov/2025 |
| D18 | Posicionar comparação de até 3 municípios (`?comparar=`) e ranking de medidas elegíveis abaixo do explorador principal em `/cidades`, com posição competitiva em empates (`=º`) e exclusão explícita de `null` | Preserva a hierarquia cartográfica da superfície principal e a estabilidade de rolagem, enquanto garante transparência metodológica sobre empates, valores nulos (7 municípios sem salário de admissão em set/2026) e bloqueio de dívida municipal direta | Se nova fonte municipal direta for incorporada ao catálogo |

Formato de nova decisão: data, contexto, alternativas consideradas, escolha, consequência, evidência e fase afetada.
