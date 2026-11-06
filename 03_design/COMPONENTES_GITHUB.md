# Componentes e reaproveitamento do GitHub

Referência: https://github.com/NicolasDev-web/Dashboard_de_Bairros_de_Fortaleza/tree/main/dashboard

Arquivos inspecionados: index.html, styles.css, app.js, pixels.js, morar.js, seguranca-app.js, transito-app.js e precos.js. Os caminhos abaixo são os reais do repositório, não componentes React já prontos. A implementação é majoritariamente HTML/CSS e JavaScript com funções e objetos globais.

| Arquivo / ponto do código inspecionado | Uso proposto | Adaptação necessária |
|---|---|---|
| dashboard/styles.css, :root e .nav/.hero/.segmentado | Tokens, hierarquia, navegação e controles | Extrair padrões e substituir tokens, contraste e estados |
| dashboard/styles.css:715 em diante | Regras responsivas e movimento reduzido | Revalidar em novas composições e telas |
| dashboard/pixels.js:5, CidadePixels | Abertura cartográfica em pixels, opcional | Depende de geometrias, propriedades e callbacks da referência; desacoplar bairro/índice |
| dashboard/app.js:390, ranking; :395, ficha | Lista e ficha ligadas à seleção | Trocar identificador para código IBGE e introduzir metadados/cobertura |
| dashboard/app.js:544, selecionar; :557, segmentado | Seleção sincronizada e controles | Estado central único e testes de filtro |
| dashboard/app.js:621, evolucao | Desenho/tooltip e transição de evolução | Reescrever cálculos conforme série e medida atuais |
| dashboard/seguranca-app.js:46, segmentado; :152, ficha | Reportagem temática e detalhes territoriais | Não importar regras CVLI/AIS nem dados de vítimas |
| dashboard/transito-app.js, helpers el/s/dica/aoAparecer | SVG, dicas e revelação de seção | Remover dependências TRANSITO/RELATORIO_VIARIO; tooltip por foco/toque |
| dashboard/morar.js:1001, gravarHash | Estado compartilhável | Somente filtros públicos; não gravar dados pessoais em URL |
| dashboard/morar.js:45 e :241 | Teto financeiro e pontuação | Não reaproveitar regras de negócio imobiliárias |

Números de linha correspondem à leitura de 05/11/2026 na branch main; podem mudar. Conferir nomes de funções antes de adaptar.

## Estratégia

Reconstruir componentes pequenos no novo projeto, preservando os padrões que funcionam. Ordem: botões/tokens → SectionHeader → MetricCard → SourceNote → SegmentedControl → MunicipalitySearch → MunicipalityPanel → TerritorialMap → ComparisonTable → TimeSeries.

O usuário autorizou consultar/adaptar seu projeto. Não houve cópia integral do código para o pacote nem alterações no repo. Se código literal for transplantado na implementação, registrar caminho, commit, trechos e adaptações; conferir dependências e licenças de terceiros. O repositório não anunciou licença geral no metadado consultado; não afirmar que todo o código é de livre redistribuição.

## Não transportar

Dados dos bairros, fontes de trânsito, credenciais/chaves de serviço, notas calculadas, parâmetros de financiamento, URLs sensíveis, globais de dados e regras de negócio imobiliárias. Também não carregar bibliotecas de 3D para uma animação que pode ser resolvida com SVG/CSS.
