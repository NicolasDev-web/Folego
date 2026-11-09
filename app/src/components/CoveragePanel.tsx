import type { Municipality } from "../data/municipalities";
import { municipalDebtCoverage } from "../data/fixtures/coverage";
import { describeObservation } from "../lib/observation";
import { EmploymentDetailsDialog } from "./EmploymentDetailsDialog";

type CoveragePanelProps = {
  municipality: Municipality;
};

export function CoveragePanel({ municipality }: CoveragePanelProps) {
  const observation = municipalDebtCoverage(municipality.slug);
  const state = describeObservation(observation);
  const population = new Intl.NumberFormat("pt-BR").format(municipality.population_2022);
  const currency = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
  const medianIncome = currency.format(municipality.income_pc_median_2022);
  const meanIncome = currency.format(municipality.income_pc_mean_2022);
  const employment = municipality.formal_employment;
  const balance = `${employment.balance >= 0 ? "+" : ""}${new Intl.NumberFormat("pt-BR").format(employment.balance)}`;
  const employmentPeriod = new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${employment.period}-01T00:00:00Z`));

  return (
    <aside className="coverage-panel" aria-live="polite">
      <header className="coverage-heading">
        <p>Município do Ceará</p>
        <h2>{municipality.name}</h2>
        <span>{municipality.region}</span>
      </header>

      <section className="primary-fact" aria-label="População residente">
        <p className="result-value">{population}</p>
        <h3>habitantes</h3>
        <p>Censo 2022 · IBGE</p>
      </section>

      <section className="income-fact" aria-label="Rendimento domiciliar per capita">
        <div>
          <h3>Renda domiciliar per capita</h3>
          <span>Mediana</span>
        </div>
        <p className="income-value">{medianIncome}</p>
        <p>mensal nominal · Censo 2022</p>
        <small>Média municipal: {meanIncome}</small>
      </section>

      <section className="employment-fact" aria-label="Movimentação do emprego formal">
        <div>
          <h3>Emprego formal</h3>
          <span>{employmentPeriod}</span>
        </div>
        <p className={`employment-value ${employment.balance < 0 ? "is-negative" : ""}`}>
          {balance}
        </p>
        <p>postos no mês</p>
        <small>
          {new Intl.NumberFormat("pt-BR").format(employment.admissions)} admissões ·{" "}
          {new Intl.NumberFormat("pt-BR").format(employment.dismissals)} desligamentos
        </small>
        <EmploymentDetailsDialog municipality={municipality} periodLabel={employmentPeriod} />
      </section>

      <section className="availability-row">
        <div>
          <h3>Dívida municipal direta</h3>
          <p>{state.description}</p>
        </div>
        <span className={`status-chip status-${state.tone}`}>{state.label}</span>
      </section>

      <details className="coverage-details">
        <summary>Fontes e limites</summary>
        <div>
          <p>
            População, renda e emprego formal são observados no município. A dívida não recebe
            valor estadual, regional ou demonstrativo.
          </p>
          <dl>
            <div><dt>Escala</dt><dd>Município</dd></div>
            <div><dt>Universo</dt><dd>{observation.universe}</dd></div>
            <div><dt>Apuração</dt><dd>Fonte direta ainda não validada</dd></div>
          </dl>
          <a
            href="https://servicodados.ibge.gov.br/api/v3/agregados/4714/periodos/2022/variaveis/93?localidades=N6[N3[23]]"
          >
            Fonte da população
          </a>
          <a href="https://sidra.ibge.gov.br/tabela/10295">Fonte da renda</a>
          <a href="https://www.gov.br/trabalho-e-emprego/pt-br/acesso-a-informacao/acoes-e-programas/programas-projetos-acoes-obras-e-atividades/estatisticas-trabalho/novo-caged/2026/setembro/pagina-inicial">
            Fonte do emprego
          </a>
          <a href={observation.source_url}>Entender a cobertura</a>
        </div>
      </details>
    </aside>
  );
}

