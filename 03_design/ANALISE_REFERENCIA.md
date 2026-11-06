# Auditoria da referência — Bairros de Fortaleza

Análise realizada em 05/11/2026 por navegação nas quatro páginas públicas, leitura das seções e inspeção do código no GitHub. A auditoria é de padrões e estrutura; não certifica a precisão dos números do projeto original nem equivale a teste completo de acessibilidade, mobile e todos os estados interativos.

Site: https://dashboardfortaleza.vercel.app/index.html

Repo correspondente: https://github.com/NicolasDev-web/Dashboard_de_Bairros_de_Fortaleza (homepage do repo aponta ao mesmo domínio; branch main). Não houve alteração no repositório original.

## Página inicial, seção por seção

| Seção observada | Padrão de UX/design | Adaptação para Fôlego |
|---|---|---|
| Navegação fixa | Marca compacta, âncoras, CTA e mudança de contraste na rolagem | Panorama, Cidades, Evolução, Dívidas e Método; CTA Buscar cidade |
| Hero “Onde morar em Fortaleza” | Título muito grande, duas colunas, mapa em pixels, fundo cobalto | Pergunta investigativa, mapa do Ceará real; verde petróleo e areia |
| Resumo revelado na rolagem | Uma frase interpretativa + três números, muito respiro | Frase baseada em achado validado; três medidas com universos explícitos |
| Mapa dos bairros | Controles segmentados, ano, camadas, legenda | Mapa dos municípios; métrica e competência; cobertura visível |
| Pesos do índice | Sliders tornam o índice manipulável | Não transportar: não teremos índice arbitrário de superendividamento |
| Ficha do bairro | Detalhes após seleção | Ficha municipal com cobertura, período, série e comparação |
| Ranking com busca | Ordenação e seleção sincronizadas ao mapa | Tabela pesquisável; ranking só com dado direto comparável |
| Ônibus / trajeto | Origem/destino, inversão, resultado principal e alternativas em acordeão | Reutilizar o padrão de seleção pareada para comparar cidades; remover lógica de rotas |
| Evolução 2010–2022 | Ordenação visual, cores de variação e extremos destacados | Série mensal estadual; mudanças municipais apenas quando houver histórico próprio |
| Preços do m² | Alternância mediana/média, filtros, mapa e distribuição | Perfil de modalidades; alternar saldo e participação com definições claras |
| Ficha da regional e bairros | Revelação progressiva de detalhes | Contexto sub-regional destacado como outro território; nunca distribuído entre cidades |
| Mais análises | Cards editoriais abrem reportagens próprias | Histórias: cartão/rotativo, renda/trabalho e Fortaleza |
| Metodologia e limitações | Conceitos junto de links de origem | Resumo de leitura + notas técnicas, dados e cobertura por indicador |
| Rodapé | Proveniência temporal e volta ao topo | Competências por fonte, versão da investigação e histórico de atualização |

## Página Trânsito

| Seção | Observação | Transferência de padrão |
|---|---|---|
| Abertura e resumo | Mapa vetorial temático e números de entrada | Contextualizar escala/tempo já na abertura |
| Por onde passa mais carro | Mapa e ranking sincronizados | Seleção cruzada mapa/tabela |
| Onde é mais lento | Horários segmentados, números e mapa | Pequeno conjunto de filtros com resposta imediata |
| Onde machuca | Pontos e lista de vias | Apenas com dado realmente pontual; não inventar localização de devedores |
| Quem morre | Série, pictogramas, idade e comparação externa | Composição de grupos/medidas com cuidado ao denominador |
| Quando | Heatmap por hora/dia | Não transplantar: nossas séries são majoritariamente mensais |
| Método | Regras e diferenças de cobertura | Dar ao leitor explicação específica da medida |

## Página Segurança

| Seção | Observação | Transferência de padrão |
|---|---|---|
| Abertura / resumo | Frase com comparação histórica e geografia | Texto editorial só depois da análise |
| Onde | Áreas oficiais e ficha/lista | Respeitar geografia oficial mesmo que não coincida com cidade |
| Tendência | Série da cidade, pequenos múltiplos e bloco parcial de 2026 | Séries por UF e por recorte disponível; marcar ano parcial |
| Horário | Heatmap | Não usar granularidade temporal inexistente |
| Vítimas | Barras de perfil e pictogramas | Mostrar perfis nas fontes com abertura disponível; não cruzar pessoas entre fontes |
| O que aparece junto | Comparação com características socioeconômicas | Relações agregadas com escalas/anos claros e sem causalidade |
| Método | Conceitos, taxas/áreas e limites | Forte referência para transparência sem excesso de jargão |

## Página Onde morar

Entrada com proposta clara, duração estimada, mapa e botão Começar. Primeiro passo observado: renda, entrada, quartos e navegação; código descreve dez passos e resultado com mapa/lista e ajustes.

O código contempla orçamento, segurança, saúde, lazer, saneamento, mobilidade, educação, comércio, perfil do bairro e trajeto habitual. É um padrão útil de progressão curta e feedback. Para Fôlego, substituir por exploração guiada sem pedir renda pessoal: escolher território, pergunta e tema. O teto imobiliário e a pontuação de bairros não servem ao novo domínio.

## Linguagem visual observada

Geist e Geist Mono; cobalto #2f37c4; papel lilás #ececf2; títulos grandes e peso moderado; raios discretos de 3px; bordas finas; mapas/canvas/SVG; pouco ornamento em cards; animação de entrada e interação. Código contém `prefers-reduced-motion` e media queries. A existência dessas regras não comprova sozinha que toda interação é acessível.

## O que preservar

Hierarquia editorial, protagonismo dos dados, mapas ligados a listas, instruções curtas, progressão de detalhe, fontes visíveis e interface que dá contexto antes do filtro.

## O que evoluir

Reduzir trechos de rolagem obrigatória; garantir navegação por teclado; informação essencial não pode depender de hover; mapa tem equivalente em tabela; filtros por geografia devem bloquear combinações impossíveis; acessibilidade e tela pequena entram nos critérios desde a primeira fase visual.
