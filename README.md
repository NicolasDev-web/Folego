# Fôlego — dívidas, renda e território

Plano de produto e investigação • Ceará, municípios e Brasil • versão 1.0 • 05/11/2026

Nome provisório: **Fôlego**. Pergunta central: como o crédito, os atrasos e a pressão sobre a renda evoluem no Ceará e que diferenças territoriais conseguimos demonstrar com dados públicos?

Este pacote contém planejamento SDD, auditoria da referência visual, direção de UX/UI, metodologia didática e contratos iniciais de dados. A aplicação e a investigação estatística completa serão desenvolvidas nas fases descritas. Os exemplos de desenho não apresentam resultados da pesquisa.

## Aplicação inicial

Em 06/11/2026 começou a implementação da base em `app/`. A primeira versão navegável inclui a abertura editorial, as rotas de panorama, cidades e método, um piloto de busca municipal, estados explícitos de cobertura e filtros públicos persistidos na URL. Ela ainda não publica resultados estatísticos: a ausência de uma fonte municipal direta é mostrada como ausência, nunca como zero.

Para executar localmente:

```bash
cd app
npm install
npm run dev
```

Verificações disponíveis:

```bash
npm test
npm run build
npm run qa:screenshots
```

O relatório da primeira rodada técnica está em `evidencias/QA_FRONTEND.md`.

## Comece aqui

1. Leia `01_contexto/METODOLOGIA_DIDATICA.md` para entender os conceitos e limites.
2. Leia `02_fontes/VIABILIDADE_MUNICIPAL.md`: a análise municipal é requisito do produto, mas a taxa de endividamento de cada cidade depende de fonte direta validada.
3. Veja `03_design/ANALISE_REFERENCIA.md`, `03_design/UX_UI.md` e `03_design/direcao_visual.svg`.
4. Execute `sdd/00_viabilidade/` e depois `sdd/01_ux/`. Cada fase tem spec, plano e microtarefas com aceite.
5. Use `PROMPT_INICIAL.md` no agente do VS Code e atualize `sdd/STATUS.md` ao terminar cada tarefa.

## Escopo acordado

- Investigação de pessoas físicas e famílias; PJ aparece somente em contexto explicitamente separado.
- Três escalas: Brasil, Ceará e cidades cearenses. Fortaleza tem uma camada própria de pesquisa local.
- Prioridade de produto: experiência editorial bonita, contemporânea, legível e acessível, com exploração geográfica.
- Referência analisada: https://dashboardfortaleza.vercel.app/index.html e páginas Trânsito, Segurança e Onde morar; repositório correspondente confirmado por homepage no GitHub.
- Sem copiar conclusões, indicadores compostos ou regras de recomendação imobiliária para o novo domínio.

## Entregas deste pacote

Contexto, metodologia, catálogo de fontes, viabilidade municipal, desenho de indicadores, auditoria de todas as seções principais da referência, inventário de componentes do GitHub, especificação de UX, tokens CSS, prancha visual, arquitetura, contratos de dados e oito fases SDD.

`evidencias/` guarda metadados e uma pequena amostra de resposta pública do SCR para validar a estrutura. Não é uma base analítica pronta. O mês de amostra não é declarado como o último disponível.

## Decisões centrais

Não estimar dados municipais replicando uma média estadual. Não confundir operações com pessoas. Não tratar crédito como sinônimo de dificuldade financeira. Não publicar ranking de superendividamento com variáveis indiretas. Exibir cobertura, fonte e competência em cada indicador.

Documentos Markdown abrem no VS Code. A prancha SVG abre em navegador ou editor de imagens. Nenhuma instalação é necessária para ler o pacote.
