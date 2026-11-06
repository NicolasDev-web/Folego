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
    <article className="coverage-panel" aria-live="polite">
      <div className="coverage-heading">
        <div>
          <p className="place-kicker">Município do Ceará</p>
          <h2>{municipality.name}</h2>
          <p>{municipality.region}</p>
        </div>
        <span className="status-chip status-partial">Cobertura mista</span>
      </div>

      <div className="coverage-results">
        <section className="coverage-result coverage-result-observed">
          <p className="result-value">{population}</p>
          <div>
            <span className="status-chip status-available">Dado observado</span>
            <h3>População residente</h3>
            <p>Censo Demográfico 2022 · IBGE · pessoas</p>
          </div>
        </section>

        <section className="coverage-result">
          <p className="result-symbol" aria-label="Sem valor disponível">
            —
          </p>
          <div>
            <span className={`status-chip status-${state.tone}`}>{state.label}</span>
            <h3>Dívida municipal direta</h3>
            <p>{state.description}</p>
          </div>
        </section>
      </div>

      <div className="coverage-source">
        <p>
          O contexto populacional usa a tabela 4714 do SIDRA. O estado de dívida segue a matriz
          de viabilidade e permanece sem valor.
        </p>
        <a
          className="text-link"
          href="https://servicodados.ibge.gov.br/api/v3/agregados/4714/periodos/2022/variaveis/93?localidades=N6[N3[23]]"
        >
          Consultar a fonte do IBGE
        </a>
      </div>

      <dl className="coverage-metadata">
        <div>
          <dt>Escala</dt>
          <dd>Município</dd>
        </div>
        <div>
          <dt>Universo</dt>
          <dd>{observation.universe}</dd>
        </div>
        <div>
          <dt>Estado da apuração</dt>
          <dd>Fonte direta ainda não validada</dd>
        </div>
      </dl>

      <p className="fixture-note">
        A população é um dado observado. A dívida municipal não recebe valor demonstrativo.
      </p>
      <a className="text-link" href={observation.source_url}>
        Entender a viabilidade municipal
      </a>
    </article>
  );
}

