# Direção de UX/UI

## Personalidade

Editorial, humana e precisa. A identidade representa orçamento e espaço para respirar; evita aparência de banco, aplicativo de cobrança ou painel financeiro genérico. Base visual: verde petróleo, papel areia, tinta escura e terracota para destaque.

| Token | Valor proposto | Uso |
|---|---|---|
| fundo | #F4F1E8 | Superfície principal |
| superficie | #FFFEF9 | Painéis de leitura |
| tinta | #142D2C | Texto principal |
| tinta secundaria | #4C6260 | Notas e textos auxiliares |
| marca | #125C57 | Ações, foco e séries principais |
| hero | #103E3B | Abertura editorial |
| destaque | #B94D32 | Seleção editorial e atenção |
| linha | #D7DCD3 | Separadores |
| sem dado | #C7CBC5 | Ausência com hachura e texto |

Paleta é proposta, não homologação de contraste. Em fase 01 verificar WCAG AA: 4,5:1 no texto normal e 3:1 em texto grande/elementos relevantes. Não usar terracota automaticamente como piora: o significado da métrica define a semântica.

Tipografia: Geist para texto e títulos, Geist Mono para competências, rótulos e pequenos números. Fontes locais/subconjunto quando viável; fallback do sistema. Título principal fluido 48–112px; seções 32–56px; corpo 16–18px, entrelinha 1,5; legenda >=12px. Números tabulares. Raio 4–8px, borda fina, sombra rara. Escala de espaçamento 4/8/12/16/24/32/48/64/96.

## Organização e interações

Cabeçalho com cinco destinos: Panorama, Cidades, Evolução, Dívidas, Método. Marca + CTA “Buscar cidade”. Em mobile, navegação compacta com menu acessível e acesso direto à busca.

Hero: pergunta grande, linha de contexto, ações “Explorar cidades” e “Entender os indicadores”. No lado visual, Ceará com geometrias reais quando disponíveis; a composição abstrata da prancha é apenas direção gráfica. Não codificar intensidade de dívida sem dado validado.

Panorama: até três medidas por vez. Cada uma traz valor, unidade, universo, território, competência, variação e acesso à definição. Não equiparar pessoas e carteira. A redação deve explicar a diferença em uma linha curta.

Explorador: desktop 2/3 mapa + 1/3 ficha. Barra: indicador, competência, busca e limpar. Clique, teclado ou lista selecionam cidade. Seleção mostra contorno; legenda mostra unidade e limites, além de “sem dado”. Mobile: busca → indicador → mapa reduzido → ficha abaixo; não prender todo o scroll ao mapa.

Ficha municipal: nome, município/UF, cobertura, indicador selecionado e origem. Blocos separados para observação municipal e contexto regional. Botão “Comparar”. Não ocultar a escala territorial na ficha.

Comparador: até três cidades, cada uma identificada por uma cor constante. A seleção fica em uma faixa compacta; valores lado a lado recebem barras proporcionais para leitura relativa, mantendo o número exato. Período e fonte permanecem visíveis, enquanto unidade e universo entram em detalhe progressivo. No celular, cada indicador vira um bloco vertical sem rolagem lateral. Quando não houver dado comparável, apresentar uma única explicação para o conjunto; não preencher com ano próximo silenciosamente. Séries e comparação ficam disponíveis por link compartilhável de filtros públicos.

Evolução: gráficos de linha sem suavização que invente forma, anotação de quebra e opção nominal/real quando válida. Faixas de renda em pequenos múltiplos, evitando quinze séries sobrepostas. Composição: barras horizontais; distribuição: só se dados permitirem. Sem gráficos de pizza em excesso ou mapas como decoração repetida.

Método: camada curta “Como ler este número”, seguida de detalhes, fonte, arquivo/tabela, competência e regra de cálculo. Exportar CSV filtrado com metadados junto do arquivo.

## Estados obrigatórios

| Estado | Comportamento |
|---|---|
| Carregando | Skeleton sem números fictícios; mensagem acessível |
| Erro | Explicação simples, repetir e acesso à última versão validada com data |
| Sem seleção | Orientação curta e busca em destaque |
| Sem dado | Traço e texto “Não disponível para este recorte”; não zero |
| Suprimido | Explicar restrição da fonte, sem revelar/reconstruir valor |
| Filtro incompatível | Bloquear a combinação e sugerir um recorte disponível |
| Série parcial | Mostrar cobertura e não traçar linha atravessando lacuna |
| Fonte desatualizada | Competência visível; não esconder data |

## Movimento

Entradas de 180–400ms; mapa e gráficos não pulsam continuamente. Sem rolagem sequestrada. Respeitar `prefers-reduced-motion`; conteúdo já legível sem animação/JavaScript quando possível. Reveal de texto não pode atrasar leitura ou foco.

## Plano de teste com pessoas

Cinco participantes de conveniência em rodada exploratória, deixando claro que não representa o público inteiro. Tarefas: localizar Sobral, dizer qual a fonte e data, comparar com Fortaleza, explicar dívida versus atraso e encontrar o motivo de um valor indisponível. Registrar sucesso sem ajuda, erros, tempo aproximado e observações. Meta inicial de produto: 4/5 concluírem as tarefas principais; não é teste estatístico. Rever composição da amostra e repetir após correções.

## Aceite visual e técnico

Verificar telas 390, 768 e 1440px, zoom 200%, teclado, leitor de tela em fluxo principal, contraste e redução de movimento. Sem overflow horizontal global. Alvos de toque >=44px como meta. Mapa tem busca/lista equivalente. Tabelas têm cabeçalhos e gráficos resumo textual. Metas de desempenho, a medir em fase 07: LCP <=2,5s, INP <=200ms e CLS <=0,1 em ambiente definido; não são resultados já obtidos.
