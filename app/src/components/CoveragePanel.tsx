import type { Municipality } from "../data/municipalities";
import { municipalDebtCoverage } from "../data/fixtures/coverage";
import { describeObservation } from "../lib/observation";

type CoveragePanelProps = {
  municipality: Municipality;
};

export function CoveragePanel({ municipality }: CoveragePanelProps) {
  const observation = municipalDebtCoverage(municipality.id);
  const state = describeObservation(observation);

  return (
    <article className="coverage-panel" aria-live="polite">
      <div className="coverage-heading">
        <div>
          <p className="place-kicker">Município do Ceará</p>
          <h2>{municipality.name}</h2>
          <p>{municipality.region}</p>
        </div>
        <span className={`status-chip status-${state.tone}`}>{state.label}</span>
      </div>

      <div className="coverage-result">
        <p className="result-symbol" aria-label="Sem valor disponível">
          —
        </p>
        <div>
          <h3>Dívida municipal direta</h3>
          <p>{state.description}</p>
        </div>
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
        Protótipo de cobertura. Nenhum número demonstrativo é apresentado como resultado.
      </p>
      <a className="text-link" href={observation.source_url}>
        Entender a viabilidade municipal
      </a>
    </article>
  );
}

