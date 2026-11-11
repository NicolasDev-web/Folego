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
        Ver quais empregos
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
              <h2 id="employment-dialog-title">O trabalho que movimentou {municipality.name}</h2>
              <span>
                O município fechou o mês com saldo de {signedNumber(employment.balance)} postos.
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
                <h3 id="growing-occupations-title">Ocupações que mais abriram postos</h3>
                <p>Saldo entre admissões e desligamentos</p>
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
                        {number.format(occupation.admissions)} admissões ·{" "}
                        {number.format(occupation.dismissals)} desligamentos
                      </small>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="employment-empty">Nenhuma ocupação teve saldo positivo no mês.</p>
              )}
                </section>

                <div className="employment-dialog-secondary">
                  <section aria-labelledby="employment-sectors-title">
                <header>
                  <h3 id="employment-sectors-title">Setores mais movimentados</h3>
                  <p>Admissões e desligamentos somados</p>
                </header>
                <dl className="employment-sectors">
                  {employment.busiest_sectors.map((sector) => (
                    <div key={sector.code}>
                      <dt>{sector.title}</dt>
                      <dd>
                        <span>{number.format(sector.admissions + sector.dismissals)} movimentos</span>
                        <strong>{signedNumber(sector.balance)}</strong>
                      </dd>
                    </div>
                  ))}
                </dl>
                  </section>

                  {employment.average_admission_salary !== null && (
                    <section className="admission-salary" aria-label="Salário médio das admissões">
                  <span>Salário médio das admissões</span>
                  <strong>{currency.format(employment.average_admission_salary)}</strong>
                  <small>
                    valor nominal · {number.format(employment.salary_observations)} admissões elegíveis
                  </small>
                  <small>
                    Entre 0,3 e 150 salários mínimos, sem vínculos intermitentes.
                    {employment.salary_observations < 5 && " Poucas admissões: a média pode variar muito."}
                  </small>
                    </section>
                  )}

                  {employment.declining_occupations.length > 0 && (
                    <section aria-labelledby="declining-occupations-title">
                  <header>
                    <h3 id="declining-occupations-title">Maiores recuos</h3>
                    <p>Ocupações com mais desligamentos líquidos</p>
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
                <h3>Nenhuma movimentação registrada no mês</h3>
                <p>
                  O Novo Caged não registrou admissões nem desligamentos em {municipality.name} nesta
                  competência. Saldo zero não significa ausência de empregos existentes.
                </p>
              </section>
            )}
          </div>

          <footer className="employment-dialog-footer">
            <p>
              São movimentações do mês no município do estabelecimento, não o total de pessoas
              empregadas. Ocupações seguem a CBO 2002; setores seguem a CNAE 2.0.
            </p>
            <a href="https://www.gov.br/trabalho-e-emprego/pt-br/assuntos/cbo/servicos/downloads/downloads">
              Consultar classificação oficial
            </a>
          </footer>
        </div>
      </dialog>
    </>
  );
}
