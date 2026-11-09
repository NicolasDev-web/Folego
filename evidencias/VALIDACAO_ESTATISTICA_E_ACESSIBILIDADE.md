# Validação Estatística, Auditoria de Cobertura e Acessibilidade — Fase 06

Data: 09/11/2026. Escopo: Checklist assinado de reconciliação estatística (`06-01`), auditoria de ausência e sigilo (`06-02`), verificação de jornadas e acessibilidade (`06-03`), QA visual nas três larguras (`06-05`) e registro de riscos e pendências (`06-06`).

---

## 1. Checklist de Reconciliação Estatística (`06-01`)

| Verificação | Regra / Critério | Resultado obtido | Status |
|---|---|---|---|
| **Ponderação de taxas (`inad90_carteira`)** | Recalculada por $\sum P / \sum C$, nunca média simples de percentuais | Conferido nas 33 competências (`CE 2026-09 = 6,20%`, `NE = 7,04%`, `BR = 6,17%`) | Aprovado |
| **Escala monetária `SCR.data` vs `SGS 20541`** | Reconciliação da carteira PF nacional em `2026-08` | `SCR.data` = R$ 4,776 trilhões vs `SGS 20541` = R$ 4,680 trilhões (divergência de 2,05% explicada por escopo de modalidades livres/direcionadas) | Aprovado |
| **Deflação pelo IPCA (`IBGE SIDRA 1737`)** | Fator $I_{\text{2026-09}} / I_t$ aplicado apenas a valores monetários em `R$` | `I_2026-09 = 7495,21`; percentuais e contagens preservados sem deflação | Aprovado |
| **Soma municipal do Novo Caged (`2026-09`)** | Soma de admissões − desligamentos dos 184 municípios cearenses | `45.512 − 40.356 = +5.156` vínculos formais (100% idêntico ao total estadual) | Aprovado |
| **Validação contra `CONTRATO_DADOS.json`** | `Draft202012Validator` sobre todas as observações públicas exportadas | **872 observações** validadas com 0 violações de schema | Aprovado |

---

## 2. Auditoria de Cobertura, Sigilo e Ausência (`06-02`)

1. **Preservação de `null` no IPDC Fortaleza (`2025-11`):** Confirmado em `app/public/data/labor_and_surveys.json` e na tabela de percepção na página inicial (`status: indisponivel`, `value: null`, sem interpolação).
2. **Preservação de `null` no salário médio de admissão municipal (`2026-09`):** Os **7 municípios** sem admissões com salário positivo informado em setembro de 2026 (`Baixio`, `Choró`, `Ibicuitinga`, `Potiretama`, `Salitre`, `Tarrafas`, `Umari`) mantêm `average_admission_salary: null` e são excluídos do ranking numérico (`177 incluídos · 7 excluídos`).
3. **Sigilo de operações $\le 15$ no SCR.data:** As linhas com `numero_de_operacoes = "<= 15"` têm contagem convertida para `None` na normalização e são contabilizadas em `linhas_op_suprimidas` (`1.261` linhas no Ceará PF em `2026-09`), nunca convertidas em `0` ou `15`.
4. **Bloqueio de dívida municipal direta:** Tanto a ficha municipal (`CoveragePanel`) quanto a comparação (`MunicipalComparisonSection`) e o ranking (`MunicipalRankingSection`) bloqueiam qualquer atribuição de taxa estadual ou sub-regional aos municípios.

---

## 3. Jornadas, Teclado, Contraste e QA Visual (`06-03` e `06-05`)

- **Suíte automatizada de testes unitários (`npm test`):** 4 arquivos de teste e **17 asserções aprovadas** (`geo.test.ts`, `observation.test.ts`, `municipalComparisonAndRanking.test.ts`, `investigationAnalysis.test.ts`).
- **Suíte automatizada E2E e visual (`node scripts/capture-qa.mjs`):**
  - Verificadas as rotas `/`, `/cidades` e `/metodo` em **390 px**, **768 px** e **1440 px** com **zero rolagem horizontal** (`scrollWidth <= clientWidth`) e **zero erros de console/página**.
  - Navegação por teclado validada no combobox de busca (`ArrowDown`, `Enter`, `Escape`), nos polígonos do mapa (`role="button"`, `tabIndex=0`, `Enter`/`Space`), no diálogo modal (`Escape`) e nos controles segmentados (`aria-pressed`).

---

## 4. Riscos Restantes e Pendências Declaradas (`06-04` e `06-06`)

- **Pesquisa com participantes humanos (`01-05` e `06-04`):** Em conformidade estrita com a diretriz do projeto (*"não inventar resultado de pesquisa com usuários"*), as tarefas `01-05` e `06-04` permanecem abertas para aplicação presencial/remota com 5 participantes reais usando a aplicação publicada em produção.
- **Unidade monetária bruta do serviço `BCB-SUB` (`Olinda scr_sub_regiao`):** O `$metadata` oficial do Banco Central declara apenas `Edm.Decimal` sem explicitar fator de milhar; por segurança metodológica, exibimos na interface apenas a razão adimensional `vencido15_sub (%)` (`status: parcial`).
