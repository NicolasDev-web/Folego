import { Link } from "react-router-dom";
import { SourceNote } from "../components/SourceNote";
import { useInvestigationData } from "../data/useInvestigationData";
import { observationsToCsv } from "../lib/investigationAnalysis";

const commitments = [
  "Não transformar média estadual ou sub-regional em dado municipal.",
  "Não tratar operações, pessoas e famílias como se fossem o mesmo universo.",
  "Não preencher valores ausentes com zero.",
  "Exibir fonte, competência, unidade, universo e território em cada indicador.",
];

const indicatorCatalog = [
  {
    id: "carteira_pf",
    name: "Saldo da carteira ativa PF",
    formula: "SUM(carteira_ativa) para cliente = PF",
    unit: "R$ (nominal e real IPCA set/2026)",
    scale: "UF (Ceará), Região (Nordeste) e Brasil",
    source: "BCB · SCR.data",
    period: "2019-08 a 2026-09 (33 competências)",
  },
  {
    id: "inad90_carteira",
    name: "Taxa de inadimplência da carteira PF (> 90 dias)",
    formula: "SUM(carteira_inadimplida) / SUM(carteira_ativa)",
    unit: "% ponderado pelo estoque",
    scale: "UF, Região e Brasil (por modalidade, porte e ocupação)",
    source: "BCB · SCR.data",
    period: "2019-08 a 2026-09",
  },
  {
    id: "saldo_operacao",
    name: "Saldo médio por operação visível PF",
    formula: "SUM(carteira_ativa_visivel) / SUM(numero_de_operacoes > 15)",
    unit: "R$/operação",
    scale: "UF, Região e Brasil",
    source: "BCB · SCR.data",
    period: "2019-08 a 2026-09",
  },
  {
    id: "vencido15_sub",
    name: "Proporção vencida (> 15 dias) na sub-região postal",
    formula: "SUM(VENCIDO_ACIMA_DE_15_DIAS) / SUM(CARTEIRA)",
    unit: "% (status: parcial)",
    scale: "Sub-região postal BCB (códigos 60, 61, 62 e 63 no Ceará)",
    source: "BCB · Olinda scr_sub_regiao",
    period: "2019-08 a 2026-08",
  },
  {
    id: "comprometimento_br",
    name: "Comprometimento de renda das famílias com serviço da dívida",
    formula: "Série sazonalmente ajustada SGS 29034",
    unit: "% da renda disponível",
    scale: "Exclusivo Brasil (sem abertura por UF ou município)",
    source: "BCB · SGS 29034",
    period: "2019-01 a 2026-08",
  },
  {
    id: "familias_endividadas",
    name: "Proporção de famílias endividadas e com contas em atraso",
    formula: "Proporção amostral ponderada sobre o total de famílias",
    unit: "% das famílias pesquisadas",
    scale: "Brasil (PEIC/CNC) e Fortaleza — capital_pesquisa (IPDC/Fecomércio-CE)",
    source: "CNC · PEIC e Fecomércio-CE · IPDC",
    period: "2025-04 a 2026-10 (2025-11 preservado como null no IPDC)",
  },
  {
    id: "renda_domiciliar_pc_mediana",
    name: "Rendimento domiciliar per capita (mediana e média)",
    formula: "Soma dos rendimentos do domicílio / moradores (P50 e média)",
    unit: "R$ nominais de 2022",
    scale: "184 municípios do Ceará",
    source: "IBGE · Censo Demográfico 2022 (SIDRA 10295)",
    period: "2022",
  },
  {
    id: "saldo_emprego_formal",
    name: "Saldo de emprego formal, ocupações CBO e salário médio de admissão",
    formula: "Admissões − Desligamentos; média salarial mensalizada das admissões entre 0,3 e 150 salários mínimos, excluindo vínculos intermitentes",
    unit: "Vínculos celetistas e R$ nominais",
    scale: "184 municípios do Ceará, UF, Região e Brasil",
    source: "MTE · Novo Caged",
    period: "2020-01 a 2026-08 (série ajustada) e 2026-09 (detalhe municipal)",
  },
];

export function MethodPage() {
  const investigationState = useInvestigationData();

  function downloadAllValidatedCsv() {
    if (investigationState.status !== "ready") return;
    const allObs = [
      ...investigationState.macro.observations,
      ...investigationState.profiles.observations,
      ...investigationState.labor.observations,
    ];
    const csv = observationsToCsv(allObs);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "folego_872_observacoes_validadas.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  return (
    <main id="conteudo" className="method-page">
      <header className="page-intro method-intro">
        <p className="section-marker">Método em linguagem direta · Fase 05 concluída</p>
        <h1>Um número só é útil quando você sabe o que ele mede.</h1>
        <p>
          Fôlego separa saldo, atraso, renda e percepção. Cada medida preserva a definição, o
          universo e a escala territorial da fonte original.
        </p>
      </header>

      <section className="method-grid" aria-label="Compromissos do projeto">
        {commitments.map((commitment, index) => (
          <article key={commitment}>
            <span>{String(index + 1).padStart(2, "0")}</span>
            <p>{commitment}</p>
          </article>
        ))}
      </section>

      <section className="method-catalog-section" aria-labelledby="catalog-heading">
        <div className="section-header-block">
          <div>
            <p className="section-marker">Dicionário auditável de indicadores</p>
            <h2 id="catalog-heading">Fórmulas, universos e limites por indicador</h2>
            <p className="section-lead">
              Todas as taxas percentuais agregadas são recalculadas como médias ponderadas pelos
              estoques originais (nunca como média simples de percentuais).
            </p>
          </div>
          {investigationState.status === "ready" ? (
            <button
              type="button"
              className="button button-dark"
              onClick={downloadAllValidatedCsv}
            >
              Baixar 872 observações em CSV
            </button>
          ) : null}
        </div>

        <div className="comparison-table-container">
          <table className="comparison-table">
            <caption>
              Catálogo de indicadores implementados e validados contra{" "}
              <code>04_tecnico/CONTRATO_DADOS.json</code>
            </caption>
            <thead>
              <tr>
                <th scope="col">Indicador (ID)</th>
                <th scope="col">Regra de cálculo / Fórmula</th>
                <th scope="col">Unidade</th>
                <th scope="col">Escala territorial permitida</th>
                <th scope="col">Fonte e cobertura</th>
              </tr>
            </thead>
            <tbody>
              {indicatorCatalog.map((item) => (
                <tr key={item.id}>
                  <th scope="row">
                    <strong>{item.name}</strong>
                    <span className="comparison-cell-note">
                      <code>{item.id}</code>
                    </span>
                  </th>
                  <td>
                    <code>{item.formula}</code>
                  </td>
                  <td>{item.unit}</td>
                  <td>{item.scale}</td>
                  <td>
                    <strong>{item.source}</strong>
                    <span className="comparison-cell-note">{item.period}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="method-breaks-section" aria-label="Quebras metodológicas e lacunas preservadas">
        <SourceNote
          sourceLabel="Quebra metodológica 01 · SCR.data em janeiro de 2025 (Resolução CMN 4.966)"
          sourceUrl="https://dadosabertos.bcb.gov.br/dataset/scr_data"
          period="Marco em 2025-01"
          territoryScope="UF, Região e Brasil"
          universe="Ativo problemático da carteira de crédito no SFN"
          formula="sdd-scr-v2-pre2025 vs. sdd-scr-v2-pos2025 (Característica Especial 19)"
          limitNote="A partir de janeiro de 2025, o SCR.data passou a contabilizar como ativo problemático apenas operações marcadas com a característica especial 19. A série de inadimplência (> 90 dias) permanece contínua."
        />
        <SourceNote
          sourceLabel="Lacuna preservada 02 · IPDC Fortaleza em novembro de 2025 (2025-11)"
          sourceUrl="https://www.fecomercio-ce.com.br/pesquisas-e-estudos/"
          period="Competência 2025-11"
          territoryScope="Fortaleza (capital_pesquisa · IBGE 2304400)"
          universe="Famílias residentes na capital Fortaleza"
          formula="status = indisponivel · value = null"
          limitNote="A Fecomércio-CE não publicou boletim mensal do IPDC para novembro de 2025. A competência é mantida estritamente como null, sem interpolação linear nem substituição por zero."
        />
      </section>

      <section className="method-detail">
        <div>
          <h2>Da fonte à tela</h2>
          <p>
            A coleta registra versão e hash SHA-256 de cada arquivo bruto, valida o grão dos
            dados contra o contrato JSON Schema Draft 2020-12, preserva ausências e só publica
            agregados compatíveis.
          </p>
        </div>
        <aside>
          <p>Documentação técnica e pacotes públicos</p>
          <a href="https://github.com/NicolasDev-web/Folego/blob/main/01_contexto/METODOLOGIA_DIDATICA.md">
            Metodologia didática
          </a>
          <a href="https://github.com/NicolasDev-web/Folego/blob/main/02_fontes/RELATORIO_QUALIDADE_DADOS.md">
            Relatório de qualidade e reconciliação
          </a>
          <a href="https://github.com/NicolasDev-web/Folego/blob/main/04_tecnico/CONTRATO_DADOS.json">
            Contrato de dados (JSON Schema)
          </a>
          <a href="/data/state_macro_series.json" download>
            Baixar state_macro_series.json
          </a>
          <a href="/data/credit_profiles.json" download>
            Baixar credit_profiles.json
          </a>
          <a href="/data/labor_and_surveys.json" download>
            Baixar labor_and_surveys.json
          </a>
        </aside>
      </section>

      <Link className="button button-dark" to="/cidades">
        Ver a cobertura municipal
      </Link>
    </main>
  );
}
