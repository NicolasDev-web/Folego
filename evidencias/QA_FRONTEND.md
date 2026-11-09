# QA da base do frontend e capítulos investigativos

Data: 09/11/2026. Escopo: Fases 03, 04, 05, 06 e 07 — páginas `/`, `/cidades` e `/metodo`, capítulos investigativos de crédito/trabalho/percepção, explorador cartográfico municipal, comparação controlada de até 3 municípios, ranking elegível e exportação CSV.

## Resultado

- `npm test`: **4 arquivos e 17 testes aprovados** (`src/data/geo.test.ts`, `src/lib/observation.test.ts`, `src/lib/municipalComparisonAndRanking.test.ts`, `src/lib/investigationAnalysis.test.ts`).
- `npm run build`: TypeScript (`tsc --noEmit`) e build de produção concluídos com Vite 8.3.6 (`50 modules transformed`, JS gzip `125,25 kB`, CSS gzip `9,62 kB`).
- Auditoria de dependências após instalação: 0 vulnerabilidades reportadas pelo npm.
- Navegação confirmada nas rotas `/`, `/cidades` e `/metodo`, todas com `h1` semântico, filtros públicos persistidos na URL (`?territorio=`, `?valor=`, `?cidade=`, `?comparar=`) e zero erros de console.
- Na página inicial (`/`):
  - **Capítulo 01 (`#panorama`):** Alinha Ceará (`R$ 120,15 bi`, inadimplência `6,20%`), Nordeste (`R$ 778,11 bi`, `7,04%`) e Brasil (`R$ 4.785,23 bi`, `6,17%`) na competência `2026-09`, além do comprometimento nacional de renda (`SGS 29034`: `28,99%` em `2026-08`).
  - **Capítulo 02 (`#evolucao`):** Renderiza as 33 competências (`2019-08..2026-09`) e exibe a quebra metodológica de `2025-01` (`Resolução CMN 4.966`) com polilinhas separadas (`pre2025` e `pos2025`) para `Ativo problemático (%)`.
  - **Capítulo 03 (`#dividas`):** Exibe composição por modalidade PF, porte de renda em salários mínimos, ocupação PF e o recorte isolado das sub-regiões postais `BCB-SUB 60–63` (`status: parcial`).
  - **Capítulo 04 (`#trabalho-e-percepcao`):** Contrasta PNAD trimestral (`2026-T2`), Novo Caged Ajustado (`2020-01..2026-08`) e pesquisas `PEIC` (Brasil) vs `IPDC` (Fortaleza — `capital_pesquisa`), preservando explicitamente `2025-11` como `Indisponível (null — sem boletim 2025-11)` e oferecendo exportação CSV.
- Na página municipal (`/cidades`):
  - As 184 geometrias são renderizadas nos 4 modos (`Território` com zoom regional, `Emprego`, `Renda`, `População`).
  - Comparação de até 3 cidades (`04-04`) e ranking estrito para medidas elegíveis (`04-05`) validados com tratamento de empates (`=º`), exclusão explícita dos 7 municípios com `null` em salário de admissão e bloqueio de dívida municipal direta.
- Na página de método (`/metodo`):
  - Dicionário auditável com fórmulas de todos os indicadores, notas de quebra metodológica e botões de download em CSV e JSON.

## Larguras verificadas

| Largura | Página inicial (`/`) | Cidades (`/cidades`) | Método (`/metodo`) | Overflow horizontal |
|---:|---|---|---|---|
| 390 px | Aprovada | Aprovada | Aprovada | Não (`0 px`) |
| 768 px | Aprovada | Aprovada | Aprovada | Não (`0 px`) |
| 1440 px | Aprovada | Aprovada | Aprovada | Não (`0 px`) |

Screenshots reproduzíveis com `npm run qa:screenshots`:

- `evidencias/qa/home-390.png`, `home-768.png`, `home-1440.png`
- `evidencias/qa/home-capitulo1-panorama-1440.png`
- `evidencias/qa/home-capitulo2-evolucao-quebra2025-1440.png`
- `evidencias/qa/home-capitulo3-perfis-1440.png`
- `evidencias/qa/home-capitulo4-trabalho-percepcao-1440.png`
- `evidencias/qa/metodo-390.png`, `metodo-768.png`, `metodo-1440.png`
- `evidencias/qa/cidades-sobral-390.png`, `cidades-sobral-1440.png`
- `evidencias/qa/cidades-sobral-empregos-390.png`, `cidades-sobral-empregos-1440.png`
- `evidencias/qa/cidades-mapa-zoom-sobral-1440.png`, `cidades-mapa-emprego-1440.png`, `cidades-mapa-renda-1440.png`, `cidades-mapa-populacao-1440.png`
- `evidencias/qa/cidades-comparacao-1440.png`, `cidades-ranking-mediana-1440.png`, `cidades-ranking-salario-1440.png`, `cidades-ranking-divida-1440.png`
