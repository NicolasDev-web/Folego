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
  const balance = new Intl.NumberFormat("pt-BR").format(Math.abs(employment.balance));
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

      <section className="income-fact" aria-label="Renda mensal por pessoa">
        <div>
          <h3>Renda mensal por pessoa</h3>
          <span>Censo 2022</span>
        </div>
        <p className="income-value">{medianIncome}</p>
        <p>Metade dos moradores tinha renda por pessoa de até esse valor por mês.</p>
        <small>Média por pessoa: {meanIncome}</small>
      </section>

      <section className="employment-fact" aria-label="Empregos com carteira assinada">
        <div>
          <h3>Empregos com carteira assinada</h3>
          <span>{employmentPeriod}</span>
        </div>
        <p className={`employment-value ${employment.balance < 0 ? "is-negative" : ""}`}>
          {balance}
        </p>
        <p>{employment.balance > 0 ? "postos a mais no mês" : employment.balance < 0 ? "postos a menos no mês" : "de diferença entre entradas e saídas"}</p>
        <small>
          {new Intl.NumberFormat("pt-BR").format(employment.admissions)} contratações ·{" "}
          {new Intl.NumberFormat("pt-BR").format(employment.dismissals)} desligamentos
        </small>
        <EmploymentDetailsDialog municipality={municipality} periodLabel={employmentPeriod} />
      </section>

      <section className="availability-row">
        <div>
          <h3>Endividamento dos moradores</h3>
          <p>Ainda não temos uma fonte confiável que informe a dívida dos moradores desta cidade.</p>
        </div>
        <span className={`status-chip status-${state.tone}`}>{state.label}</span>
      </section>

      <details className="coverage-details">
        <summary>De onde vêm os dados?</summary>
        <div>
          <p>
            A população e a renda vêm do Censo. Os dados de emprego contam contratações e saídas em estabelecimentos da cidade.
          </p>
          <a
            href="https://servicodados.ibge.gov.br/api/v3/agregados/4714/periodos/2022/variaveis/93?localidades=N6[N3[23]]"
          >
            Fonte da população
          </a>
          <a href="https://sidra.ibge.gov.br/tabela/10295">Fonte da renda</a>
          <a href="https://www.gov.br/trabalho-e-emprego/pt-br/acesso-a-informacao/acoes-e-programas/programas-projetos-acoes-obras-e-atividades/estatisticas-trabalho/novo-caged/2026/setembro/pagina-inicial">
            Fonte do emprego
          </a>
          <a href={observation.source_url}>Ver a fonte de crédito do Banco Central</a>
        </div>
      </details>
    </aside>
  );
}

