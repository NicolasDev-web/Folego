# Síntese Investigativa — Fase 05 (Narrativa, Séries e Perfis)

Data: 09/11/2026. Escopo: Análise empírica reconciliada entre Ceará (`UF`), Nordeste (`Região`), Brasil (`BR`), sub-regiões postais do Ceará (`BCB-SUB 60–63`), Fortaleza (`capital_pesquisa`) e os 184 municípios cearenses.

---

## 1. Recorte Comum: Ceará, Nordeste e Brasil (`05-01`)

Na data-base comum de **setembro de 2026 (`2026-09`)**, no universo de operações de crédito de Pessoas Físicas (`PF`) reportadas ao Sistema de Informações de Créditos (`SCR.data` do Banco Central):

| Território | Escala | Carteira ativa PF (`R$`) | Participação CE | Atraso 15–90d (`R$`) | Inadimplência `> 90d` (`%`) | Ativo problemático (`%`) | Saldo médio por contrato visível (`R$/op.`) |
|---|---|---:|---:|---:|---:|---:|---:|
| **Ceará** | `UF` | R$ 120.146.335.639,16 | 100,00% | R$ 1.473.169.781,91 | **6,20%** | 9,12% | R$ 3.648,36 |
| **Nordeste** | `Região` | R$ 778.112.333.050,17 | 15,44% | R$ 11.082.998.143,73 | **7,04%** | 10,37% | R$ 3.732,20 |
| **Brasil** | `País` | R$ 4.785.228.356.861,28 | 2,51% | R$ 61.823.782.545,00 | **6,17%** | 9,53% | R$ 5.125,92 |

- **Comprometimento nacional da renda (`SGS 29034`):** Em agosto de 2026 (`2026-08`), o comprometimento da renda disponível das famílias brasileiras com o serviço da dívida atingiu **28,99%** (série com ajuste sazonal, restrita ao agregado nacional).
- **Sigilo estatístico preservado:** No Ceará em `2026-09`, há **32.898.903 operações visíveis** e **1.261 linhas** com quantidade `<= 15` suprimidas pelo Banco Central; o indicador `saldo_operacao` é calculado exclusivamente sobre o subconjunto com contagem visível.

---

## 2. Composição por Modalidade, Porte de Renda e Sub-regiões Postais (`05-02`)

### 2.1 Modalidades de crédito PF no Ceará (`2026-09` vs. `2019-12`)
- **Empréstimos (consignado, pessoal e outros):** R$ 51,15 bilhões (**42,57%** da carteira PF estadual), com inadimplência (`> 90 dias`) de **6,88%**.
- **Cartão de crédito:** R$ 30,52 bilhões (**25,40%** da carteira PF), com inadimplência (`> 90 dias`) de **10,75%** — o maior foco proporcional de atraso prolongado.
- **Financiamentos imobiliários:** R$ 25,28 bilhões (**21,04%** da carteira PF), com inadimplência (`> 90 dias`) de apenas **1,25%**.
- **Financiamentos (veículos e bens):** R$ 9,53 bilhões (**7,93%** da carteira PF), com inadimplência de **4,12%**.

### 2.2 Porte de renda PF em salários mínimos (`2026-09`)
- A inadimplência (`> 90 dias`) no Ceará apresenta gradiente inverso à faixa de rendimento nos portes intermediários: **7,37%** na faixa de `Mais de 1 a 2 salários mínimos` (18,84% da carteira) contra **4,23%** na faixa de `Mais de 5 a 10 salários mínimos` (18,19% da carteira).
- **Limite metodológico obrigatório:** As faixas de porte no `SCR.data` são definidas em múltiplos do salário mínimo nominal vigente em cada mês; portanto, variações temporais misturam mudança de composição da clientela, valorização do salário mínimo e variação real de crédito.

### 2.3 Recorte sub-regional postal (`BCB-SUB 60–63`, `status: parcial`)
- Na competência `2026-08`, a proporção da carteira PF vencida acima de 15 dias (`vencido15_sub`) foi de **4,89%** no código `60`, **6,13%** no código `61`, **6,18%** no código `62` e **5,95%** no código `63`.
- Conforme validado no portão da Fase 00, esses códigos representam prefixos de CEP de 2 dígitos e permanecem isolados da escala municipal.

---

## 3. Evolução Histórica e Quebra Metodológica de Janeiro de 2025 (`05-03`)

- Entre agosto de 2019 (`2019-08`) e setembro de 2026 (`2026-09`), a carteira ativa PF no Ceará cresceu de R$ 65,65 bilhões (a preços reais de set/2026 pelo IPCA) para **R$ 120,15 bilhões** (+83,0% reais), enquanto a taxa de inadimplência (`> 90 dias`) subiu de **4,17%** para **6,20%**.
- **Quebra metodológica documentada em `2025-01`:** Com a entrada em vigor da Resolução CMN nº 4.966/2021 em janeiro de 2025, o `SCR.data` alterou a contabilização de `ativo_problematico` (passando a exigir a marcação da Característica Especial 19). Na interface e nos pacotes exportados, a série é dividida em `sdd-scr-v2-pre2025` (até `2024-12`) e `sdd-scr-v2-pos2025` (a partir de `2025-01`), sem interpolação entre os dois regimes.

---

## 4. Renda, Trabalho Formal e Pesquisas de Percepção (`05-04` e `05-05`)

- **PNAD Contínua Trimestral (`2026-T2`):** A taxa de desocupação no Ceará ficou em **6,3%** (CV: 6,7%), próxima à média nacional de **5,8%** (CV: 1,4%), mas o rendimento médio habitual real no Ceará (**R$ 2.345**, CV: 4,2%) permaneceu **32,2% abaixo** da média brasileira (**R$ 3.457**).
- **Novo Caged Ajustado (`2020-01..2026-08`) e Setembro/2026:** O Ceará acumulou saldo positivo de **+38.412 vínculos formais** no acumulado de jan–ago/2026 (série ajustada) e **+5.156 postos** em setembro de 2026 nos 184 municípios.
- **Percepção de endividamento (`PEIC` vs. `IPDC Fortaleza`):** Em outubro de 2026 (`2026-10`), **73,6%** das famílias pesquisadas em Fortaleza (`capital_pesquisa`) declararam possuir dívidas no IPDC/Fecomércio-CE (e **24,8%** com contas em atraso). A competência `2025-11` é preservada como `null` (`indisponivel`).
