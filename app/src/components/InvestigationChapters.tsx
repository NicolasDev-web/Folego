import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import type {
  CreditProfilesFile,
  LaborAndSurveysFile,
  StateMacroSeriesFile,
  TerritoryMacroCode,
} from "../data/investigation";
import {
  buildIncomeBracketProfile,
  buildMacroPanoramaComparison,
  buildModalitiesComparison,
  buildSurveyComparisonRows,
  observationsToCsv,
  splitSeriesAround2025Break,
  type ValueMode,
} from "../lib/investigationAnalysis";
import { MetricCard } from "./MetricCard";
import { SectionHeader } from "./SectionHeader";
import { SegmentedControl } from "./SegmentedControl";
import { SourceNote } from "./SourceNote";

type InvestigationChaptersProps = {
  macro: StateMacroSeriesFile;
  profiles: CreditProfilesFile;
  labor: LaborAndSurveysFile;
};

type EvolutionMetric = "inad90_pct" | "ativo_problematico_pct" | "carteira_bilhoes";
type ProfileTab = "modalidades" | "porte_pf" | "ocupacao_pf" | "sub_regiao";

const brlBillions = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const brlCurrency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const pctFormatter = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const integerFormatter = new Intl.NumberFormat("pt-BR");

function formatBillions(valueBrl: number): string {
  return `R$ ${brlBillions.format(valueBrl / 1_000_000_000)} bi`;
}

function formatPercent(value: number | null | undefined): string {
  return value == null ? "Não disponível" : `${pctFormatter.format(value)}%`;
}

function formatCurrency(value: number | null | undefined): string {
  return value == null ? "Não disponível" : brlCurrency.format(value);
}

function formatBalance(value: number | null | undefined): string {
  return value == null ? "Não disponível" : `${value > 0 ? "+" : ""}${integerFormatter.format(value)}`;
}

export function InvestigationChapters({
  macro,
  profiles,
  labor,
}: InvestigationChaptersProps) {
  const [searchParams, setSearchParams] = useSearchParams();

  const territoryParam = searchParams.get("territorio");
  const activeTerritory: TerritoryMacroCode =
    territoryParam === "NE" || territoryParam === "BR" ? territoryParam : "CE";

  const valorParam = searchParams.get("valor");
  const valueMode: ValueMode = valorParam === "nominal" ? "nominal" : "real";

  const [evolutionMetric, setEvolutionMetric] =
    useState<EvolutionMetric>("inad90_pct");
  const [profileTab, setProfileTab] = useState<ProfileTab>("porte_pf");

  function updateUrlFilter(key: string, value: string) {
    const next = new URLSearchParams(searchParams);
    next.set(key, value);
    setSearchParams(next, { preventScrollReset: true });
  }

  const panorama = useMemo(
    () => buildMacroPanoramaComparison(macro, "2026-09", valueMode),
    [macro, valueMode],
  );

  const selectedTerritorySnapshot = useMemo(
    () =>
      panorama.territories.find((t) => t.territoryId === activeTerritory) ??
      panorama.territories[0],
    [panorama.territories, activeTerritory],
  );

  const modalitiesRows = useMemo(
    () => buildModalitiesComparison(profiles, activeTerritory, "2026-09"),
    [profiles, activeTerritory],
  );

  const incomeProfile = useMemo(
    () => buildIncomeBracketProfile(profiles, activeTerritory, "2026-09"),
    [profiles, activeTerritory],
  );

  const occupationRows = useMemo(() => {
    const raw =
      profiles.profiles_by_period["2026-09"]?.ocupacao_pf[activeTerritory] ?? [];
    return [...raw].sort((a, b) => b.carteira_ativa_brl - a.carteira_ativa_brl);
  }, [profiles, activeTerritory]);

  const subRegiaoRows = useMemo(() => {
    const latestSub =
      profiles.sub_regiao_ce.series_by_period["2026-08"] ?? [];
    return latestSub.filter((item) => item.cliente === "PF");
  }, [profiles]);

  const evolutionSeries = useMemo(() => {
    const ceSplit = splitSeriesAround2025Break(macro.series.CE.PF);
    const neSplit = splitSeriesAround2025Break(macro.series.NE.PF);
    const brSplit = splitSeriesAround2025Break(macro.series.BR.PF);
    return { ceSplit, neSplit, brSplit };
  }, [macro]);

  const surveyComparison = useMemo(
    () => buildSurveyComparisonRows(labor),
    [labor],
  );

  function handleDownloadCsv(scope: "all" | TerritoryMacroCode) {
    const allObs = [
      ...macro.observations,
      ...profiles.observations,
      ...labor.observations,
    ];
    const filtered =
      scope === "all"
        ? allObs
        : allObs.filter(
            (obs) =>
              obs.territory_id === scope ||
              (scope === "CE" &&
                (obs.territory_id === "2304400" ||
                  ["60", "61", "62", "63"].includes(obs.territory_id))),
          );
    const csvContent = observationsToCsv(filtered);
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `folego_observacoes_${scope.toLowerCase()}_2026-09.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  }

  // Build SVG coordinates for Evolution Chart (Chapter 2)
  const chartPoints = evolutionSeries.ceSplit.allPoints;
  const chartWidth = 760;
  const chartHeight = 290;
  const padLeft = 56;
  const padRight = 28;
  const padTop = 24;
  const padBottom = 42;
  const plotW = chartWidth - padLeft - padRight;
  const plotH = chartHeight - padTop - padBottom;

  const extractMetricValue = (p: (typeof chartPoints)[number]): number | null => {
    if (evolutionMetric === "inad90_pct") return p.inad90_pct;
    if (evolutionMetric === "ativo_problematico_pct")
      return p.ativo_problematico_pct;
    const raw =
      valueMode === "real" ? p.carteira_ativa_real_brl : p.carteira_ativa_brl;
    return raw / 1_000_000_000;
  };

  const activeSeriesList =
    evolutionMetric === "carteira_bilhoes"
      ? [
          {
            id: activeTerritory,
            label: selectedTerritorySnapshot.territoryName,
            color: "#125c57",
            split:
              activeTerritory === "CE"
                ? evolutionSeries.ceSplit
                : activeTerritory === "NE"
                  ? evolutionSeries.neSplit
                  : evolutionSeries.brSplit,
          },
        ]
      : [
          {
            id: "CE",
            label: "Ceará",
            color: "#125c57",
            split: evolutionSeries.ceSplit,
          },
          {
            id: "NE",
            label: "Nordeste",
            color: "#b94d32",
            split: evolutionSeries.neSplit,
          },
          {
            id: "BR",
            label: "Brasil",
            color: "#5b6d6a",
            split: evolutionSeries.brSplit,
          },
        ];

  const allValues = activeSeriesList.flatMap((s) =>
    s.split.allPoints.map(extractMetricValue),
  ).filter((value): value is number => value !== null);
  const minVal = Math.max(0, Math.floor(Math.min(...(allValues.length ? allValues : [0])) * 0.85));
  const maxVal = Math.ceil(Math.max(0, ...allValues) * 1.08);
  const valSpan = Math.max(maxVal - minVal, 1);

  const periodToX = (index: number) =>
    padLeft + (index / Math.max(chartPoints.length - 1, 1)) * plotW;
  const valueToY = (val: number) =>
    padTop + plotH - ((val - minVal) / valSpan) * plotH;

  const indexByPeriod = new Map(
    chartPoints.map((pt, idx) => [pt.period, idx]),
  );
  const breakIdx = indexByPeriod.get("2025-01") ?? 21;
  const breakX = periodToX(breakIdx);

  function buildSeriesPath(points: typeof chartPoints) {
    const commands: string[] = [];
    let previousIndex: number | undefined;
    for (const point of points) {
      const index = indexByPeriod.get(point.period);
      const value = extractMetricValue(point);
      if (index === undefined || value === null) {
        previousIndex = undefined;
        continue;
      }
      const command = previousIndex === index - 1 ? "L" : "M";
      commands.push(`${command}${periodToX(index).toFixed(1)},${valueToY(value).toFixed(1)}`);
      previousIndex = index;
    }
    return commands.join(" ");
  }

  const ipdcOctober = surveyComparison.ipdcPoints.find((point) => point.period === "2026-10");
  const pnadCeDesoc =
    labor.pnad_continua.desocupacao_trimestral.CE?.series["2026-T2"];
  const pnadBrDesoc =
    labor.pnad_continua.desocupacao_trimestral.BR?.series["2026-T2"];
  const pnadCeRend =
    labor.pnad_continua.rendimento_habitual_trimestral.CE?.series["2026-T2"];
  const pnadBrRend =
    labor.pnad_continua.rendimento_habitual_trimestral.BR?.series["2026-T2"];
  const ceMacroCaged = labor.novo_caged_adjusted.macro_series?.CE as
    | Record<string, { saldo?: number }>
    | undefined;
  const cagedCeYtd = ceMacroCaged?.["2026-YTD"];
  const cagedCe12m = ceMacroCaged?.["2025-09..2026-08"];
  const ceara = panorama.territories[0];
  const cearaIncome = profiles.profiles_by_period[ceara.period]?.porte_pf.CE ?? [];
  const upToOneMinimumWage = cearaIncome.find((row) => row.porte === "Até 1 salário mínimo")?.inad90_pct;
  const fiveToTenMinimumWages = cearaIncome.find((row) => row.porte === "Mais de 5 a 10 salários mínimos")?.inad90_pct;

  return (
    <div className="investigation-chapters">
      <section className="content-section credit-overview" id="resumo-ceara" aria-labelledby="credit-overview-title">
        <p className="section-marker">Ceará · Setembro de 2026</p>
        <h2 id="credit-overview-title">As dívidas em três números</h2>
        <div className="credit-overview-grid">
          <article>
            <h3>Quanto ainda falta pagar</h3>
            <p className="credit-overview-value">{formatBillions(ceara.carteiraAtivaBrl)}</p>
            <p>Crédito que as pessoas no Ceará ainda tinham a pagar, incluindo parcelas em dia.</p>
          </article>
          <article>
            <h3>Quanto está em contratos com atraso</h3>
            <p className="credit-overview-value">{formatCurrency(ceara.inad90Pct)}{ceara.inad90Pct !== null && <small> a cada R$ 100</small>}</p>
            <p>De cada R$ 100 a pagar, essa parte estava em contratos com pelo menos uma parcela atrasada há mais de 90 dias.</p>
          </article>
          <article>
            <h3>Como o atraso varia com a renda</h3>
            <p className="credit-overview-value">{formatPercent(upToOneMinimumWage)} <small>até 1 salário mínimo</small></p>
            <p>Parte do crédito em contratos com atraso acima de 90 dias. Na faixa de mais de 5 a 10 salários mínimos, foi {formatPercent(fiveToTenMinimumWages)}.</p>
          </article>
        </div>
        <p className="credit-overview-note">
          Os números acima medem dinheiro. Para saber quantas famílias têm dívidas em todo o Ceará, seria necessária uma pesquisa que cobrisse o estado. <a href="https://dadosabertos.bcb.gov.br/dataset/scr_data">Fonte: Banco Central</a>
        </p>
        <a className="text-link" href="#dividas">Ver os dados por renda e ocupação</a>
      </section>
      {/* CAPÍTULO 1: PANORAMA CE / NE / BR (05-01) */}
      <section className="content-section investigation-section" id="panorama">
        <div className="chapter-top-bar">
          <SectionHeader
            marker="Setembro de 2026"
            title="Como o Ceará se compara ao Nordeste e ao Brasil?"
            description="Veja quanto as pessoas ainda têm a pagar em crédito e qual parte está em contratos com parcelas atrasadas há mais de 90 dias."
          />
          <div className="chapter-filter-bar" aria-label="Filtros do crédito">
            <div className="filter-group">
              <span className="filter-group-label">Local em destaque</span>
              <SegmentedControl
                label="Escolher local"
                value={activeTerritory}
                onChange={(next) => updateUrlFilter("territorio", next)}
                options={[
                  { value: "CE", label: "Ceará" },
                  { value: "NE", label: "Nordeste" },
                  { value: "BR", label: "Brasil" },
                ]}
              />
            </div>
            <div className="filter-group">
              <span className="filter-group-label">Como mostrar os valores</span>
              <SegmentedControl
                label="Ajuste pela inflação"
                value={valueMode}
                onChange={(next) => updateUrlFilter("valor", next)}
                options={[
                  { value: "real", label: "Com ajuste pela inflação" },
                  { value: "nominal", label: "Valores da época" },
                ]}
              />
            </div>
          </div>
        </div>

        <div className="metric-card-grid">
          <MetricCard
            eyebrow={selectedTerritorySnapshot.territoryName}
            title="Crédito a pagar"
            formattedValue={formatBillions(selectedTerritorySnapshot.carteiraAtivaBrl)}
            unitLabel={
              valueMode === "real"
                ? "Reais ajustados pela inflação até setembro de 2026"
                : "Reais da época"
            }
            periodLabel="set/2026"
            sourceLabel="BCB · SCR.data"
            universeLabel="Contratos de crédito de pessoas físicas"
            highlight
            comparisonNote={`Ceará representa ${pctFormatter.format(panorama.ceShareOfNePct)}% da carteira PF do Nordeste e ${pctFormatter.format(panorama.ceShareOfBrPct)}% da nacional.`}
          />
          <MetricCard
            eyebrow={selectedTerritorySnapshot.territoryName}
            title="Crédito em contratos com atraso"
            formattedValue={formatPercent(selectedTerritorySnapshot.inad90Pct)}
            unitLabel="Parcela da carteira em operações com prestação vencida há mais de 90 dias"
            periodLabel="set/2026"
            sourceLabel="BCB · SCR.data"
            universeLabel="Contratos com pelo menos uma parcela atrasada há mais de 90 dias"
            comparisonNote={panorama.territories.map((row) => `${row.territoryName} · ${formatPercent(row.inad90Pct)}`).join(" | ")}
          />
          <MetricCard
            eyebrow={selectedTerritorySnapshot.territoryName}
            title="Quanto falta pagar por contrato, em média"
            formattedValue={formatCurrency(selectedTerritorySnapshot.saldoOperacaoBrl)}
            unitLabel="Reais por contrato nos grupos com contagem publicada"
            periodLabel="set/2026"
            sourceLabel="BCB · SCR.data"
            universeLabel={`${integerFormatter.format(selectedTerritorySnapshot.operacoesVisiveis)} contratos com contagem publicada`}
            comparisonNote="Uma pessoa pode ter mais de um contrato."
          />
          <MetricCard
            eyebrow="Brasil"
            title="Parte da renda usada para pagar dívidas"
            formattedValue={formatPercent(panorama.nationalIncomeCommitment.valuePct)}
            unitLabel="Parte da renda disponível destinada a juros e parcelas"
            periodLabel={panorama.nationalIncomeCommitment.period}
            sourceLabel="BCB · SGS 29034"
            universeLabel="Famílias no Brasil"
            comparisonNote="O Banco Central publica esse número para o Brasil."
          />
        </div>

        <div className="comparison-table-container">
          <table className="comparison-table">
            <caption>
              Crédito de pessoas físicas · Setembro de 2026
            </caption>
            <thead>
              <tr>
                <th scope="col">Local</th>
                <th scope="col">Crédito a pagar</th>
                <th scope="col">Parcelas atrasadas de 15 a 90 dias</th>
                <th scope="col">Em contratos com atraso acima de 90 dias</th>
                <th scope="col">Crédito com risco de não ser pago</th>
                <th scope="col">Valor médio por contrato</th>
              </tr>
            </thead>
            <tbody>
              {panorama.territories.map((row) => (
                <tr
                  key={row.territoryId}
                  className={
                    row.territoryId === activeTerritory ? "is-selected-row" : undefined
                  }
                >
                  <th scope="row">
                    <strong>{row.territoryName}</strong>
                    <span className="comparison-cell-note">{row.territoryScope}</span>
                  </th>
                  <td>{formatBillions(row.carteiraAtivaBrl)}</td>
                  <td>{formatBillions(row.vencido15a90Brl)}</td>
                  <td>
                    <strong>{formatPercent(row.inad90Pct)}</strong>
                  </td>
                  <td>{formatPercent(row.ativoProblematicoPct)}</td>
                  <td>
                    {formatCurrency(row.saldoOperacaoBrl)}
                    <span className="comparison-cell-note">
                      Apenas grupos com contagem publicada
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <SourceNote
          sourceLabel="Banco Central do Brasil · SCR.data e SGS 29034"
          sourceUrl="https://dadosabertos.bcb.gov.br/dataset/scr_data"
          period="2026-09 (SCR.data) e 2026-08 (SGS 29034)"
          territoryScope="Ceará, Nordeste e Brasil"
          universe="Operações de crédito de Pessoas Físicas acima de R$ 200 reportadas ao SCR"
          formula="Saldo dos contratos com parcela atrasada há mais de 90 dias ÷ saldo de todos os contratos × 100"
          limitNote="As taxas de crédito medem valores em reais. A parcela da renda usada para pagar dívidas vem de uma série separada do Banco Central, para todo o Brasil."
        />
      </section>

      {/* CAPÍTULO 2: EVOLUÇÃO E QUEBRA METODOLÓGICA DE 2025 (05-03) */}
      <section className="content-section investigation-section" id="evolucao">
        <div className="chapter-top-bar">
          <SectionHeader
            title="Como o crédito e os atrasos mudaram com o tempo?"
            description="Veja quanto ainda faltava pagar em crédito e quanto desse saldo estava em contratos com atraso. Escolha um item para mudar o gráfico."
          />
          <div className="chapter-filter-bar">
            <div className="filter-group">
              <span className="filter-group-label">O que mostrar no gráfico?</span>
              <SegmentedControl
                label="Escolher dado do gráfico"
                value={evolutionMetric}
                onChange={setEvolutionMetric}
                options={[
                  {
                    value: "inad90_pct",
                    label: "Contratos com atraso acima de 90 dias",
                  },
                  {
                    value: "ativo_problematico_pct",
                    label: "Crédito com risco de não ser pago",
                  },
                  {
                    value: "carteira_bilhoes",
                    label: "Crédito a pagar",
                  },
                ]}
              />
            </div>
          </div>
        </div>

        <figure className="timeseries-figure" aria-label="Gráfico de crédito ao longo do tempo">
          <div className="timeseries-header">
            <div>
              <strong>
                {evolutionMetric === "inad90_pct" &&
                  "Parte do crédito em contratos com atraso acima de 90 dias (%)"}
                {evolutionMetric === "ativo_problematico_pct" &&
                  "Parte do crédito com sinais de dificuldade de pagamento (%)"}
                {evolutionMetric === "carteira_bilhoes" &&
                  `Crédito a pagar ao longo do tempo · ${selectedTerritorySnapshot.territoryName} (${
                    valueMode === "real" ? "R$ bilhões ajustados pela inflação até set/2026" : "R$ bilhões em valores da época"
                  })`}
              </strong>
              <p>
                Meses com dados entre agosto de 2019 e setembro de 2026
              </p>
            </div>
            <div className="timeseries-legend">
              {activeSeriesList.map((s) => (
                <span key={s.id} className="legend-item">
                  <i style={{ background: s.color }} /> {s.label}
                </span>
              ))}
              {evolutionMetric === "ativo_problematico_pct" && (
                <span className="legend-item legend-break">
                  <i className="break-swatch" /> Mudança de regra · Janeiro de 2025
                </span>
              )}
            </div>
          </div>

          <div className="svg-chart-wrap">
            <svg
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              role="img"
              aria-label="Crédito ao longo do tempo, de 2019 a 2026"
            >
              {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
                const val = minVal + valSpan * ratio;
                const y = valueToY(val);
                return (
                  <g key={ratio}>
                    <line
                      x1={padLeft}
                      y1={y}
                      x2={chartWidth - padRight}
                      y2={y}
                      stroke="#d9d4c7"
                      strokeDasharray="3 3"
                    />
                    <text
                      x={padLeft - 8}
                      y={y + 4}
                      textAnchor="end"
                      fontSize="11"
                      fill="#4c6260"
                    >
                      {evolutionMetric === "carteira_bilhoes"
                        ? `${val.toFixed(0)} bi`
                        : `${val.toFixed(1)}%`}
                    </text>
                  </g>
                );
              })}

              {evolutionMetric === "ativo_problematico_pct" && (
                <g>
                  <line
                    x1={breakX}
                    y1={padTop}
                    x2={breakX}
                    y2={chartHeight - padBottom}
                    stroke="#b94d32"
                    strokeWidth="1.8"
                    strokeDasharray="5 4"
                  />
                  <text
                    x={breakX + 6}
                    y={padTop + 12}
                    fontSize="10.5"
                    fontWeight="600"
                    fill="#b94d32"
                  >
                    Jan/2025 · Mudança de regra
                  </text>
                </g>
              )}

              {activeSeriesList.map((s) => {
                if (evolutionMetric === "ativo_problematico_pct") {
                  return (
                    <g key={s.id}>
                      <path
                        fill="none"
                        stroke={s.color}
                        strokeWidth="2.4"
                        d={buildSeriesPath(s.split.pre2025Points)}
                      />
                      <path
                        fill="none"
                        stroke={s.color}
                        strokeWidth="2.4"
                        d={buildSeriesPath(s.split.pos2025Points)}
                      />
                    </g>
                  );
                }
                return (
                  <path
                    key={s.id}
                    fill="none"
                    stroke={s.color}
                    strokeWidth="2.5"
                    d={buildSeriesPath(s.split.allPoints)}
                  />
                );
              })}

              {/* X-axis labels */}
              {["2019-08", "2020-12", "2022-12", "2024-12", "2025-01", "2026-09"].map(
                (period) => {
                  const idx = indexByPeriod.get(period);
                  if (idx === undefined) return null;
                  const x = periodToX(idx);
                  return (
                    <text
                      key={period}
                      x={x}
                      y={chartHeight - 14}
                      textAnchor="middle"
                      fontSize="11"
                      fill="#142d2c"
                    >
                      {period}
                    </text>
                  );
                },
              )}
            </svg>
          </div>

          {evolutionMetric === "ativo_problematico_pct" && (
            <figcaption className="timeseries-break-note">
              O Banco Central mudou em janeiro de 2025 a regra para identificar crédito com risco de não ser pago. A linha é interrompida nessa data.
            </figcaption>
          )}
        </figure>
      </section>

      {/* CAPÍTULO 3: COMPOSIÇÃO POR MODALIDADE, RENDA, OCUPAÇÃO E SUB-REGIÃO (05-02) */}
      <section className="content-section investigation-section" id="dividas">
        <div className="chapter-top-bar">
          <SectionHeader
            title="Em quais grupos os atrasos pesam mais?"
            description="Veja quanto falta pagar por faixa de renda, categoria de trabalho ou tipo de crédito. A taxa mostra a parte desse saldo em contratos com parcela atrasada há mais de 90 dias."
          />
          <div className="chapter-filter-bar">
            <div className="filter-group">
              <span className="filter-group-label">Comparar por ({selectedTerritorySnapshot.territoryName})</span>
              <SegmentedControl
                label="Escolher o que comparar"
                value={profileTab}
                onChange={setProfileTab}
                options={[
                  { value: "porte_pf", label: "Faixas de renda" },
                  { value: "ocupacao_pf", label: "Categorias de trabalho" },
                  { value: "modalidades", label: "Tipos de crédito" },
                  {
                    value: "sub_regiao",
                    label: "Regiões por CEP",
                  },
                ]}
              />
            </div>
          </div>
        </div>

        {profileTab === "modalidades" ? (
          <div className="comparison-table-container">
            <table className="comparison-table">
              <caption>
                Composição da carteira PF por modalidade em {selectedTerritorySnapshot.territoryName}{" "}
                (2026-09) e mudança estrutural frente a 2019-12
              </caption>
              <thead>
                <tr>
                  <th scope="col">Tipo de crédito</th>
                  <th scope="col">Crédito a pagar</th>
                  <th scope="col">Parte do crédito total</th>
                  <th scope="col">Mudança na participação (2019 a 2026)</th>
                  <th scope="col">Mudança do saldo, descontada a inflação</th>
                  <th scope="col">Em contratos com atraso acima de 90 dias</th>
                </tr>
              </thead>
              <tbody>
                {modalitiesRows.map((row) => (
                  <tr key={row.modalidade}>
                    <th scope="row">
                      <strong>{row.modalidade}</strong>
                    </th>
                    <td>{formatBillions(row.current.carteira_ativa_brl)}</td>
                    <td>
                      <strong>
                        {formatPercent(row.current.participacao_pct)}
                      </strong>
                    </td>
                    <td>
                      {row.shareDeltaPp !== null
                        ? `${row.shareDeltaPp > 0 ? "+" : ""}${pctFormatter.format(row.shareDeltaPp)} pontos percentuais`
                        : "—"}
                    </td>
                    <td>
                      {row.realGrowthPct !== null
                        ? `${row.realGrowthPct > 0 ? "+" : ""}${pctFormatter.format(row.realGrowthPct)}%`
                        : "—"}
                    </td>
                    <td>
                      <strong>{formatPercent(row.current.inad90_pct)}</strong>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}

        {profileTab === "porte_pf" ? (
          <>
            <div className="comparison-table-container">
              <table className="comparison-table">
                <caption>
                  Crédito e atrasos por faixa de renda · {selectedTerritorySnapshot.territoryName} · Setembro de 2026
                </caption>
                <thead>
                  <tr>
                    <th scope="col">Faixa de renda</th>
                    <th scope="col">Crédito a pagar</th>
                    <th scope="col">Parte do crédito total</th>
                    <th scope="col">Em contratos com atraso</th>
                    <th scope="col">Valor médio por contrato</th>
                  </tr>
                </thead>
                <tbody>
                  {incomeProfile.brackets.map((item) => (
                    <tr key={item.porte}>
                      <th scope="row">
                        <strong>{item.porte}</strong>
                      </th>
                      <td>{formatBillions(item.carteira_ativa_brl)}</td>
                      <td>{formatPercent(item.participacao_pct)}</td>
                      <td>
                        <strong>{formatPercent(item.inad90_pct)}</strong>
                      </td>
                      <td>{formatCurrency(item.saldo_operacao_brl)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <details className="methodology-alert-banner">
              <summary>Como são definidas as faixas de renda?</summary>
              <p>{incomeProfile.methodologyWarning}</p>
            </details>
          </>
        ) : null}

        {profileTab === "ocupacao_pf" ? (
          <div className="comparison-table-container">
            <table className="comparison-table">
              <caption>
                Crédito e atrasos por categoria de trabalho · {selectedTerritorySnapshot.territoryName} · Setembro de 2026
              </caption>
              <thead>
                <tr>
                  <th scope="col">Categoria de trabalho</th>
                  <th scope="col">Crédito a pagar</th>
                  <th scope="col">Parte do crédito total</th>
                  <th scope="col">Em contratos com atraso</th>
                  <th scope="col">Valor médio por contrato</th>
                </tr>
              </thead>
              <tbody>
                {occupationRows.map((item) => (
                  <tr key={item.ocupacao}>
                    <th scope="row">
                      <strong>{item.ocupacao}</strong>
                    </th>
                    <td>{formatBillions(item.carteira_ativa_brl)}</td>
                    <td>{formatPercent(item.participacao_pct)}</td>
                    <td>
                      <strong>{formatPercent(item.inad90_pct)}</strong>
                    </td>
                    <td>{formatCurrency(item.saldo_operacao_brl)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}

        {profileTab === "sub_regiao" ? (
          <>
            <aside className="methodology-alert-banner" role="note">
              O Banco Central agrupa endereços pelos dois primeiros dígitos do CEP. Aqui, o número mostra a parcela do saldo vencida há mais de 15 dias.
            </aside>
            <div className="comparison-table-container">
              <table className="comparison-table">
                <caption>
                  Parcelas em atraso por região do CEP · Ceará · Agosto de 2026
                </caption>
                <thead>
                  <tr>
                    <th scope="col">Início do CEP</th>
                    <th scope="col">Tipo de região</th>
                    <th scope="col">Saldo vencido há mais de 15 dias (%)</th>
                    <th scope="col">Contratos com contagem publicada</th>
                    <th scope="col">Principal tipo de crédito</th>
                  </tr>
                </thead>
                <tbody>
                  {subRegiaoRows.map((sub) => (
                    <tr key={sub.sub_regiao}>
                      <th scope="row">
                        <strong>{sub.label}</strong>
                      </th>
                      <td>
                        <span className="status-chip status-partial">
                          Região por CEP
                        </span>
                      </td>
                      <td>
                        <strong>{formatPercent(sub.vencido15_pct)}</strong>
                      </td>
                      <td>{integerFormatter.format(sub.operacoes_visiveis)}</td>
                      <td>{sub.modalidades[0]?.modalidade ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : null}
      </section>

      {/* CAPÍTULO 4: TRABALHO, RENDA, PESQUISAS DE PERCEPÇÃO E EXPORTAÇÃO CSV (05-04, 05-05, 05-06) */}
      <section
        className="content-section investigation-section"
        id="trabalho-e-percepcao"
      >
        <SectionHeader
          title="O que as pesquisas mostram sobre emprego, renda e dívidas?"
          description="As pesquisas perguntam sobre dívidas e contas em atraso. Uma família com financiamento em dia também tem dívida. Confira o local e o mês de cada dado."
        />

        <div className="metric-card-grid">
          <MetricCard
            eyebrow="Ceará"
            title="Pessoas sem trabalho e procurando emprego"
            formattedValue={formatPercent(pnadCeDesoc?.taxa_desocupacao_pct)}
            unitLabel="Parte de quem trabalha ou procura trabalho"
            periodLabel="Abril a junho de 2026"
            sourceLabel="IBGE · SIDRA 4099"
            universeLabel="Pessoas de 14 anos ou mais na força de trabalho"
            comparisonNote={`Brasil no mesmo período · ${formatPercent(pnadBrDesoc?.taxa_desocupacao_pct)}.`}
          />
          <MetricCard
            eyebrow="Ceará"
            title="Quanto se ganha com trabalho, em média"
            formattedValue={formatCurrency(pnadCeRend?.rendimento_habitual_real_brl)}
            unitLabel="Reais por mês, com ajuste pela inflação"
            periodLabel="Abril a junho de 2026"
            sourceLabel="IBGE · SIDRA 6472"
            universeLabel="Pessoas ocupadas com rendimento de trabalho"
            comparisonNote={`Brasil no mesmo período · ${formatCurrency(pnadBrRend?.rendimento_habitual_real_brl)}.`}
          />
          <MetricCard
            eyebrow="Ceará"
            title="Postos com carteira assinada ganhos ou perdidos"
            formattedValue={formatBalance(cagedCeYtd?.saldo)}
            unitLabel="Contratações menos desligamentos"
            periodLabel="Janeiro a agosto de 2026"
            sourceLabel="MTE · Novo Caged Ajustado"
            universeLabel="Estabelecimentos que informaram contratações ou desligamentos"
            comparisonNote={`Postos ganhos ou perdidos em 12 meses (set/25 a ago/26) · ${formatBalance(cagedCe12m?.saldo)}.`}
          />
          <MetricCard
            eyebrow="Fortaleza"
            title="Consumidores com dívidas"
            formattedValue={formatPercent(ipdcOctober?.familias_endividadas_pct)}
            unitLabel={`Com contas em atraso · ${formatPercent(ipdcOctober?.familias_atraso_pct)}`}
            periodLabel="Outubro de 2026"
            sourceLabel="Fecomércio-CE · IPDC"
            universeLabel="Consumidores pesquisados em Fortaleza"
          />
        </div>

        <div className="comparison-table-container">
          <table className="comparison-table">
            <caption>
              Endividamento declarado pelas famílias na PEIC Brasil e pelos consumidores no IPDC Fortaleza
            </caption>
            <thead>
              <tr>
                <th scope="col">Mês</th>
                <th scope="col">PEIC Brasil — Endividadas (%)</th>
                <th scope="col">PEIC Brasil — Em atraso (%)</th>
                <th scope="col">IPDC Fortaleza — Endividados (%)</th>
                <th scope="col">IPDC Fortaleza — Em atraso (%)</th>
                <th scope="col">Dado do IPDC</th>
              </tr>
            </thead>
            <tbody>
              {surveyComparison.ipdcPoints.slice(-12).map((ipdcRow) => {
                const peicRow = surveyComparison.peicPoints.find(
                  (p) => p.period === ipdcRow.period,
                );
                const isMissing = ipdcRow.status === "indisponivel";
                return (
                  <tr
                    key={ipdcRow.period}
                    className={isMissing ? "row-incompatible" : undefined}
                  >
                    <th scope="row">
                      <strong>{ipdcRow.period}</strong>
                    </th>
                    <td>
                      {peicRow?.familias_endividadas_pct != null
                        ? `${pctFormatter.format(peicRow.familias_endividadas_pct)}%`
                        : "—"}
                    </td>
                    <td>
                      {peicRow?.familias_atraso_pct != null
                        ? `${pctFormatter.format(peicRow.familias_atraso_pct)}%`
                        : "—"}
                    </td>
                    <td>
                      {ipdcRow.familias_endividadas_pct !== null ? (
                        <strong>
                          {pctFormatter.format(ipdcRow.familias_endividadas_pct)}%
                        </strong>
                      ) : (
                        <span className="comparison-cell-note">
                          Não disponível
                        </span>
                      )}
                    </td>
                    <td>
                      {ipdcRow.familias_atraso_pct !== null
                        ? `${pctFormatter.format(ipdcRow.familias_atraso_pct)}%`
                        : "Não disponível"}
                    </td>
                    <td>
                      <span
                        className={`status-chip ${
                          isMissing ? "status-missing" : "status-available"
                        }`}
                      >
                        {isMissing ? "Não disponível" : "Observado"}
                      </span>
                      {ipdcRow.source_page && (
                        <p><a href={ipdcRow.source_url}>Relatório histórico, p. {ipdcRow.source_page}</a></p>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* SÍNTESE COM LASTRO E PERGUNTAS EM ABERTO (05-05) + EXPORTAÇÃO CSV (05-06) */}
        <div className="evidence-synthesis-grid">
          <article className="synthesis-card">
            <h3>O que os números mostram</h3>
            <ul>
              <li>
                <strong>O tipo de crédito faz diferença.</strong> Em setembro de 2026, a parcela
                do crédito no Ceará em contratos com atraso acima de 90 dias era de 11,24% em empréstimos
                e 1,68% em financiamentos imobiliários.
              </li>
              <li>
                <strong>O atraso pesa de forma diferente por renda.</strong> No Ceará, 7,37% da carteira de
                tomadores na faixa de mais de 1 a 2 salários mínimos correspondia a operações com parcela vencida há mais de
                90 dias, ante 4,23% na faixa de mais de 5 a 10 salários mínimos.
              </li>
              <li>
                <strong>Duas formas de medir.</strong> A pesquisa em Fortaleza conta consumidores. O Banco Central soma o valor dos contratos no Ceará.
              </li>
            </ul>
          </article>

          <article className="synthesis-card is-open-questions">
            <h3>O que ainda precisamos descobrir</h3>
            <ul>
              <li>
                <strong>Qual é a situação das dívidas em cada cidade?</strong>{" "}
                As fontes disponíveis trazem dados do estado e de regiões por CEP.
              </li>
              <li>
                <strong>Quantas pessoas têm parcelas atrasadas no Ceará?</strong> Os dados do Banco Central contam contratos. Uma pessoa pode ter vários.
              </li>
              <li>
                <strong>Quanto da renda as famílias cearenses gastam pagando dívidas?</strong>{" "}
                Esse dado está disponível para o Brasil.
              </li>
            </ul>
          </article>
        </div>

        <div className="export-panel" aria-label="Exportar dados validados em CSV">
          <div>
            <h3>Baixe os dados para conferir ou usar</h3>
            <p>
              Cada arquivo traz os valores, o local, a data e a fonte. Campos em branco indicam dado indisponível.
            </p>
          </div>
          <div className="export-actions">
            <button
              type="button"
              className="button button-dark"
              onClick={() => handleDownloadCsv(activeTerritory)}
            >
              Baixar CSV ({selectedTerritorySnapshot.territoryName})
            </button>
            <button
              type="button"
              className="button button-ghost-dark"
              onClick={() => handleDownloadCsv("all")}
            >
              Baixar todos os dados (CSV)
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
