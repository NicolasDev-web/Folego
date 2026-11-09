# Fôlego — dívidas, renda e território

Produto editorial e investigação de dados públicos • Ceará, 184 municípios, Nordeste e Brasil • Release 1.0 • 09/11/2026

- **Produção (Vercel):** https://folego-vert.vercel.app
- **Repositório:** https://github.com/NicolasDev-web/Folego

Pergunta central: *como o crédito, os atrasos, o trabalho formal e a pressão sobre a renda evoluem no Ceará e que diferenças territoriais conseguimos demonstrar com dados públicos auditáveis?*

---

## 1. Visão geral e cobertura por fonte (Release 1.0)

| Fonte oficial | Indicadores publicados | Escala territorial | Última competência validada | Estado de cobertura |
|---|---|---|---|---|
| **BCB · SCR.data** | Carteira ativa PF/PJ, inadimplência `> 90d`, atraso `15–90d`, ativo problemático e saldo por operação visível | `UF` (Ceará), `Região` (Nordeste) e `BR` | `2026-09` (33 datas-base desde `2019-08`) | `observado` (quebra documentada em `2025-01` para ativo problemático; linhas $\le 15$ preservadas como suprimidas) |
| **BCB · Olinda `scr_sub_regiao`** | Proporção vencida `> 15 dias` (`vencido15_sub`) | `sub_regiao` (códigos postais `60`, `61`, `62`, `63` no Ceará) | `2026-08` (10 datas-base desde `2019-08`) | `parcial` (sem correspondência municipal oficial) |
| **BCB · SGS `29034`** | Comprometimento de renda das famílias com o serviço da dívida | Exclusivo `BR` | `2026-08` | `observado` |
| **IBGE · Censo 2022 (`SIDRA 4714 / 10295`)** | População residente e rendimento domiciliar per capita (mediana e média) | **184 municípios** do Ceará | `2022` | `observado` (184/184 municípios) |
| **IBGE · PNAD Contínua (`SIDRA 4099 / 6472`)** | Taxa de desocupação e rendimento médio habitual real (com CV%) | `BR`, `NE`, `CE` e `Fortaleza` (`capital_pesquisa`) | `2026-T2` (`2019-T1..2026-T2`) | `observado` |
| **MTE · Novo Caged** | Admissões, desligamentos, saldo formal, ocupações CBO, setores CNAE e salário médio de admissão | **184 municípios** do Ceará, `CE`, `NE` e `BR` | `2026-09` (municipal) e `2020-01..2026-08` (série ajustada) | `observado` (7 municípios com `null` em salário de admissão em `2026-09` preservados sem conversão para zero) |
| **CNC · PEIC Nacional** | Proporção de famílias endividadas e com contas em atraso | `BR` | `2026-10` | `observado` |
| **Fecomércio-CE · IPDC** | Proporção de famílias endividadas e em atraso na capital | `Fortaleza` (`capital_pesquisa` · `2304400`) | `2026-10` (`2025-04..2026-10`) | `observado` (`2025-11` preservado como `null` / `indisponivel`) |

---

## 2. Limites metodológicos inegociáveis

1. **Dívida municipal direta permanece indisponível:** Nenhuma fonte pública direta passou pelos seis critérios do portão de viabilidade (`02_fontes/RELATORIO_VIABILIDADE.md`). A aplicação bloqueia qualquer atribuição de média estadual ou sub-regional às cidades e impede ranking por dívida municipal.
2. **Operações $\neq$ Pessoas $\neq$ Famílias:** Contratos no SCR não são CPFs desduplicados, e pesquisas amostrais de percepção (`PEIC`/`IPDC`) não equivalem a inadimplência bancária acima de 90 dias.
3. **Ausência nunca vira zero:** Valores suprimidos (`<= 15`) ou não publicados (`2025-11` no IPDC; 7 municípios sem admissões com salário positivo em `2026-09`) são mantidos como `null` e explicitados na interface e no CSV exportado.

---

## 3. Como executar e validar localmente

### Pipeline de dados (`pipeline/`)
```powershell
python -m pipeline.run_phase02
python -m pytest pipeline/tests/test_phase02.py -v
```

### Aplicação web e QA (`app/`)
```powershell
cd app
npm install
npm test -- --run
npm run build
npm run qa:screenshots
```

---

## 4. Histórico de releases

- **v1.0.0 (09/11/2026):** Entrega das fases `00_viabilidade`, `02_dados`, `03_fundacao`, `04_cidades`, `05_investigacao`, validação técnica/estatística de `06_validacao` e publicação em produção de `07_entrega` (`https://folego-vert.vercel.app`), com 872 observações contratadas, 4 capítulos investigativos interativos, explorador cartográfico em 4 modos para os 184 municípios, comparação controlada de até 3 cidades, ranking elegível e exportação CSV auditável.
