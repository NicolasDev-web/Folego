import type { Municipality } from "../data/municipalities";
import { municipalDebtCoverage } from "../data/fixtures/coverage";
import { describeObservation } from "../lib/observation";

type CoveragePanelProps = {
  municipality: Municipality;
};

export function CoveragePanel({ municipality }: CoveragePanelProps) {
  const observation = municipalDebtCoverage(municipality.slug);
  const state = describeObservation(observation);
  const population = new Intl.NumberFormat("pt-BR").format(municipality.population_2022);

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
            A população é observada no município. A dívida não recebe valor estadual, regional
            ou demonstrativo.
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
          <a href={observation.source_url}>Entender a cobertura</a>
        </div>
      </details>
    </aside>
  );
}

