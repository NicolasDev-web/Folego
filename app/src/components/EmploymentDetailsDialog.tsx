import { useRef, type CSSProperties } from "react";
import type { Municipality } from "../data/municipalities";

type EmploymentDetailsDialogProps = {
  municipality: Municipality;
  periodLabel: string;
};

const number = new Intl.NumberFormat("pt-BR");
const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function signedNumber(value: number) {
  return `${value >= 0 ? "+" : ""}${number.format(value)}`;
}

export function EmploymentDetailsDialog({
  municipality,
  periodLabel,
}: EmploymentDetailsDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const employment = municipality.formal_employment;
  const hasMovements = employment.admissions + employment.dismissals > 0;
  const largestOccupationBalance = Math.max(
    ...employment.top_occupations.map((occupation) => occupation.balance),
    1,
  );

  return (
    <>
      <button
        className="employment-details-trigger"
        type="button"
        onClick={() => dialogRef.current?.showModal()}
      >
        Ver quais empregos mudaram
      </button>

      <dialog
        ref={dialogRef}
        className="employment-dialog"
        aria-labelledby="employment-dialog-title"
        onClick={(event) => {
          if (event.target === event.currentTarget) {
            dialogRef.current?.close();
          }
        }}
      >
        <div className="employment-dialog-frame">
          <header className="employment-dialog-header">
            <div>
              <p>Emprego formal em {periodLabel}</p>
              <h2 id="employment-dialog-title">Empregos em {municipality.name}</h2>
              <span>
                {number.format(employment.admissions)} contratações e {number.format(employment.dismissals)} desligamentos no mês.
              </span>
            </div>
            <button
              type="button"
              aria-label="Fechar detalhes do emprego"
              onClick={() => dialogRef.current?.close()}
            >
              ×
            </button>
          </header>

          <div className={`employment-dialog-body ${hasMovements ? "" : "is-empty"}`}>
            {hasMovements ? (
              <>
                <section className="employment-dialog-primary" aria-labelledby="growing-occupations-title">
              <header>
                <h3 id="growing-occupations-title">Ocupações que mais ganharam postos</h3>
                <p>Contratações menos desligamentos</p>
              </header>
              {employment.top_occupations.length > 0 ? (
                <ol className="occupation-ranking">
                  {employment.top_occupations.map((occupation) => (
                    <li key={occupation.code}>
                      <div>
                        <span>{occupation.title}</span>
                        <strong>{signedNumber(occupation.balance)}</strong>
                      </div>
                      <span
                        className="occupation-bar"
                        style={{
                          "--occupation-share": `${Math.max(
                            (occupation.balance / largestOccupationBalance) * 100,
                            3,
                          )}%`,
                        } as CSSProperties}
                      />
                      <small>
                        {number.format(occupation.admissions)} contratações ·{" "}
                        {number.format(occupation.dismissals)} desligamentos
                      </small>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="employment-empty">As contratações ficaram iguais ou abaixo dos desligamentos em cada ocupação.</p>
              )}
                </section>

                <div className="employment-dialog-secondary">
                  <section aria-labelledby="employment-sectors-title">
                <header>
                  <h3 id="employment-sectors-title">Setores mais movimentados</h3>
                  <p>Onde houve mais contratações e desligamentos</p>
                </header>
                <dl className="employment-sectors">
                  {employment.busiest_sectors.map((sector) => (
                    <div key={sector.code}>
                      <dt>{sector.title}</dt>
                      <dd>
                        <span>{number.format(sector.admissions + sector.dismissals)} entradas e saídas</span>
                        <strong>{signedNumber(sector.balance)}</strong>
                      </dd>
                    </div>
                  ))}
                </dl>
                  </section>

                  {employment.average_admission_salary !== null ? (
                    <section className="admission-salary" aria-label="Salário médio de quem entrou">
                      <span>Salário médio de quem entrou</span>
                      <strong>{currency.format(employment.average_admission_salary)}</strong>
                      <small>{number.format(employment.salary_observations)} salários usados no cálculo</small>
                      {employment.salary_observations < 5 && (
                        <small>Com poucos salários, a média pode variar muito.</small>
                      )}
                      <details>
                        <summary>Como o salário médio é calculado?</summary>
                        <p>O Ministério do Trabalho usa salários mensais de 0,3 a 150 salários mínimos e exclui contratos de trabalho intermitente.</p>
                      </details>
                    </section>
                  ) : (
                    <p className="employment-empty">Sem salários disponíveis para calcular a média do mês.</p>
                  )}

                  {employment.declining_occupations.length > 0 && (
                    <section aria-labelledby="declining-occupations-title">
                  <header>
                    <h3 id="declining-occupations-title">Ocupações que mais perderam postos</h3>
                    <p>Onde as saídas mais superaram as contratações</p>
                  </header>
                  <ul className="declining-occupations">
                    {employment.declining_occupations.map((occupation) => (
                      <li key={occupation.code}>
                        <span>{occupation.title}</span>
                        <strong>{signedNumber(occupation.balance)}</strong>
                      </li>
                    ))}
                  </ul>
                    </section>
                  )}
                </div>
              </>
            ) : (
              <section className="employment-dialog-empty-state">
                <h3>Sem contratações ou desligamentos registrados</h3>
                <p>
                  O Novo Caged acompanha as entradas e saídas do mês em {municipality.name}. O total de pessoas empregadas é outra medida.
                </p>
              </section>
            )}
          </div>

          <footer className="employment-dialog-footer">
            <p>
              Os números mostram contratações e desligamentos em estabelecimentos da cidade durante o mês.
            </p>
            <a href="https://www.gov.br/trabalho-e-emprego/pt-br/assuntos/cbo/servicos/downloads/downloads">
              Consultar nomes oficiais das ocupações
            </a>
          </footer>
        </div>
      </dialog>
    </>
  );
}
