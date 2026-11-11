# Relatório de qualidade, normalização e reconciliação de dados (Fase 02)

Data de execução: 09/11/2026.
Manifesto técnico: `metadata/phase02_manifest.json` e `metadata/scr_data_monthly_hashes.json`.

## 1. Resumo da coleta e cobertura (`02-01` e `02-04`)

| Fonte (`source_id`) | Escopo territorial | Competências processadas | Artefato bruto / cache | Status |
|---|---|---|---|---|
| `BCB-SCR` | `BR`, `NE` (9 UFs), `CE` | 33 competências (`2019-08..2024-12` semestrais/anuais + `2025-01..2026-09` mensais completas; 93 CSVs catalogados via ZIP Central Directory) | `data/raw/bcb/scr_data_ce_ne_br_2026-11-09.json` | Observado |
| `BCB-SUB` | `CE` (`sub_regiao` `60, 61, 62, 63`) | 10 competências (`2019-08..2026-08`) | `data/raw/bcb/scr_sub_regiao_ce_series_2026-11-09.json` | Parcial (sem tabela municipal oficial) |
| `BCB-RENDA` / `SGS` | `BR` | `2018-01..2026-08` (`29034`, `20541`, `21084`) | `data/raw/bcb/sgs_*_2026-11-09.json` | Observado |
| `IBGE-SIDRA-10295` | `BR`, `NE`, `CE` e 184 municípios | Censo `2022` (variáveis `13604`, `13431`, `13534`) | `data/raw/ibge/renda_censo_2022_ce_2026-11-09.json` | Observado |
| `IBGE-SIDRA-1737` | `BR` | `2018-01..2026-09` (IPCA número-índice `2266`) | `data/raw/ibge/ipca_indice_1737_2026-11-09.json` | Observado |
| `IBGE-SIDRA-4099` | `BR`, `NE`, `CE`, `Fortaleza (2304400)` | `2019-T1..2026-T2` (desocupação `4099` e CV `4103`) | `data/raw/ibge/pnad_desocupacao_4099_2026-11-09.json` | Observado |
| `IBGE-SIDRA-6472` | `BR`, `NE`, `CE`, `Fortaleza (2304400)` | `2019-T1..2026-T2` (rendimento habitual real `5933`, nominal `5929` e CVs) | `data/raw/ibge/pnad_rendimento_6472_2026-11-09.json` | Observado |
| `MTE-NOVO-CAGED` | `BR`, `NE`, `CE` e 184 municípios | `2020-01..2026-08` (série ajustada, 80 meses + acumulado 2026 e 12m) | `data/raw/mte/novo_caged_ce_202608_2026-11-09.json` | Observado |
| `MTE-CAGEDMOV-202609` | 184 municípios do Ceará | `2026-09` (retrato mensal por ocupação CBO e seção CNAE) | `data/processed/municipal_employment_2026-09.csv` | Observado (sem ajustes posteriores) |
| `CNC-PEIC` | `BR` | `2025-08..2026-10` (15 competências mensais) | `data/raw/surveys/peic_cnc_202610_2026-11-09.xls` e `202611` | Observado |
| `FECOMERCIO-CE-IPDC` | `Fortaleza (2304400)` (`capital_pesquisa`) | `2025-04..2026-10` (`2025-11` indisponível/`null`) | `data/raw/surveys/surveys_peic_ipdc_2026-11-09.json` | Observado / Indisponível em `2025-11` |

---

## 2. Reconciliação de unidades, somas e subtotais (`02-02`, `02-03`, `02-05`)

### 2.1. Reconciliação `BCB-SCR` vs. `BCB-SGS-20541` e `BCB-SUB`
1. **Unidade monetária do `SCR.data` (`BCB-SCR`):**
   - Na competência `2026-08`, a soma da `carteira_ativa` de Pessoas Físicas (`PF`) no Brasil em `scrdata_202608.csv` é de **R$ 4.776.626.219.700,11** (**R$ 4,78 trilhões**), compatível em ordem de grandeza e definição com a série `SGS 20541` (*Saldo da carteira de crédito PF — Brasil*, que registra `4.680.478` R$ milhões = **R$ 4,68 trilhões** em `08/2026`).
   - No Ceará (`UF = CE`), a carteira ativa PF em `2026-08` soma **R$ 119.431.132.603,42** (**R$ 119,43 bilhões**), subindo para **R$ 120.153.204.262,15** (**R$ 120,15 bilhões**) em `2026-09`, com taxa de inadimplência `> 90 dias` (`inad90_carteira`) de **4,01%** para PF no Ceará em `2026-09` (ante **3,89%** no Nordeste e **3,67%** no Brasil).
2. **Reconciliação `BCB-SUB` (`scr_sub_regiao`) vs. `BCB-SCR` no Ceará (`2026-08`):**
   - A soma das quatro sub-regiões postais do Ceará (`60, 61, 62, 63`) em `BCB-SUB` para `PF` em `2026-08` registra `CARTEIRA = 114.530.804,25` e `VENCIDO_ACIMA_DE_15_DIAS = 5.654.940,98` (**4,9375%**), enquanto o `BCB-SCR` estadual registra `carteira_ativa = R$ 119.431.132.603,42` e `carteira_vencida = R$ 5.789.750.309,54` (**4,8478%**, diferença de apenas `0,09 p.p.`).
   - Como o `$metadata` Olinda declara `CARTEIRA` apenas como `Edm.Decimal` sem explicitar o fator de milhar (`1:1000`), os valores monetários brutos do `BCB-SUB` são preservados como `carteira_valor_fonte` e o indicador publicado `vencido15_sub` utiliza a razão percentual (`%`), mantendo `territory_level = "sub_regiao"` e `status = "parcial"`.

### 2.2. Reconciliação `MTE Novo Caged` (Tabela 7.1 vs. Soma dos 184 municípios na Tabela 8.1)
- **Fluxos (`admissoes`, `desligamentos` e `saldo`):** A soma dos 184 municípios cearenses na `Tabela 8.1` fecha com **diferença zero (`0` vínculos)** contra a linha estadual do Ceará na `Tabela 7.1` em **todas as 80 competências mensais** (`2020-01` a `2026-08`).
- **Estoques (`estoque`):** A soma dos 184 municípios fecha com **diferença zero (`0` vínculos)** em todas as competências de **`2022-09` a `2026-08`** (`1.441.588` vínculos formais no Ceará em `2026-08`). Entre `2020-01` e `2022-08`, há diferença de `10` a `358` vínculos documentada pela nota de rodapé oficial `****` do MTE (estoques municipais negativos zerados na divulgação municipal e mantidos no total estadual).

### 2.3. Separação de tabelas fato e dimensões (`02-03`)
- Todas as tabelas processadas em `data/processed/*.parquet` separam estritamente níveis territoriais e dimensões:
  - `dim_territory.parquet`: `192` registros únicos por `(territory_id, territory_level)` (`1 BR`, `1 regiao`, `1 uf`, `1 capital_pesquisa`, `4 sub_regiao`, `184 municipio`).
  - `fact_scr_macro.parquet`: contém exclusivamente folhas `PF` e `PJ` (sem linha `TOTAL` misturada), garantindo aditividade exata.
  - `fact_scr_profiles.parquet`: cada `dimension_type` (`modalidade`, `porte`, `cnae_ocupacao`) soma exatamente `100,00%` da carteira ativa do respectivo universo (`erro relativo < 0,0001`).

---

## 3. Tratamento de quebras metodológicas, sigilo e ausências (`02-04`, `02-05`, `02-06`)

1. **Quebra metodológica de janeiro/2025 no `SCR.data`:**
   - Competências até `2024-12` recebem `methodology_version = "sdd-scr-v2-pre2025"`; competências a partir de `2025-01` recebem `"sdd-scr-v2-pos2025"`.
   - O efeito da mudança da característica especial `19` sobre `ativo_problematico` é visível na transição `2024-12` → `2025-01` (no Ceará PF, `ativo_problematico_pct` passa de `7,21%` em `2024-12` para `5,34%` em `2025-01`, enquanto `inad90_pct` varia de `3,60%` para `3,73%`).
2. **Sigilo de operações (`numero_de_operacoes <= 15` mascarado como `-1`):**
   - No cálculo de `saldo_operacao`, tanto o numerador (`carteira_ativa_op_visiveis`) quanto o denominador (`operacoes_visiveis`) consideram apenas registros com `numero_de_operacoes > 0`. Quando todas as linhas de um recorte estão mascaradas (`-1`), o indicador recebe `value = null` e `status = "suprimido"`.
3. **Ausência preservada nas pesquisas (`null` nunca convertido em `0`):**
   - Na série de Fortaleza (`capital_pesquisa`, `2304400`) do `IPDC / Fecomércio-CE`, a competência `2025-11` permanece `value = null` e `status = "indisponivel"` por ausência de boletim mensal publicado.
4. **Validação de contrato (`04_tecnico/CONTRATO_DADOS.json`):**
   - Todas as **872 observações** exportadas em `state_macro_series.json`, `credit_profiles.json` e `labor_and_surveys.json` passaram sem erros pelo validador `JSON Schema Draft 2020-12`.

## 4. Correção da elegibilidade salarial municipal — 10/11/2026

A revisão dos microdados `CAGEDMOV202609` identificou que a média salarial aceitava qualquer salário positivo. A [metodologia do MTE, tabela 5 e nota de rodapé](https://www.gov.br/trabalho-e-emprego/pt-br/acesso-a-informacao/acoes-e-programas/programas-projetos-acoes-obras-e-atividades/estatisticas-trabalho/novo-caged/2026/setembro/sumario-executivo_setembro-de-2026.pdf/@@download/file) exclui valores inferiores a 0,3 ou superiores a 150 salários mínimos e vínculos intermitentes. O [salário mínimo de 2026 é R$ 1.621,00](https://www.gov.br/esocial/pt-br/noticias/novo-salario-minimo-2026-veja-como-registrar-o-reajuste-no-esocial-domestico), resultando na faixa inclusiva de R$ 486,30 a R$ 243.150,00.

O reprocessamento usa o mesmo arquivo oficial, SHA-256 `967a29800166b32ba4f9d786e95b53122eed6dbd78ca94da783290d67cd5d50d`. O campo `salário` já está mensalizado pelo MTE e não recebe outra multiplicação por horas. Não houve duplicação nem divergência entre a agregação anterior e o painel: faltavam os filtros metodológicos.

| Reconciliação das admissões do Ceará | Registros |
|---|---:|
| Total de admissões | 58.672 |
| Ausentes, não finitos ou não positivos | 401 |
| Abaixo de 0,3 salário mínimo | 604 |
| Acima de 150 salários mínimos | 61 |
| Intermitentes dentro da faixa salarial | 369 |
| Elegíveis para a média salarial | 57.237 |

As exclusões da tabela não se sobrepõem: cada registro recebe o primeiro motivo aplicável, na ordem apresentada. Dos 58.271 salários positivos anteriormente aceitos, 1.034 deixam de compor a média; os 401 ausentes/não positivos já eram excluídos. A média estadual passa de **R$ 2.548,75** para **R$ 2.081,38**, valor idêntico ao divulgado pelo MTE. A amostra ou média de **52 municípios** é corrigida, mantendo os sete municípios sem amostra elegível como `null`.

| Município | Média anterior | Média corrigida | Admissões elegíveis |
|---|---:|---:|---:|
| Croatá | R$ 143.290,06 | R$ 1.633,00 | 2 |
| Ipueiras | R$ 36.450,47 | R$ 1.519,54 | 21 |
| Quixelô | R$ 27.100,93 | R$ 1.753,31 | 13 |
| Iguatu | R$ 8.467,92 | R$ 1.772,68 | 494 |
| Itarema | R$ 8.420,88 | R$ 1.593,44 | 51 |

O saldo permanece em **5.156 vínculos**, com **58.672 admissões** e **53.516 desligamentos**; ocupações e setores preservam todos os vínculos. A geração agora falha antes de gravar os pacotes processados/públicos quando a média salarial estadual não coincide com a referência independente. Os testes de elegibilidade, limites, intermitentes, amostra vazia, regressões municipais e integridade dos pacotes passam a integrar a verificação contínua. Amostras com menos de cinco admissões elegíveis recebem uma observação de cautela no detalhe e na comparação; esse limiar é uma decisão de apresentação do Fôlego, não um critério de exclusão do MTE.
