import { Link } from "react-router-dom";
import { EditorialArt } from "../components/EditorialArt";
import { InvestigationChapters } from "../components/InvestigationChapters";
import { SectionHeader } from "../components/SectionHeader";
import { PopulationDebtSection } from "../components/PopulationDebtSection";
import { useInvestigationData } from "../data/useInvestigationData";
import { useMunicipalities } from "../data/useMunicipalities";

const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 2,
  minimumFractionDigits: 0,
});
const integer = new Intl.NumberFormat("pt-BR");
const month = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric", timeZone: "UTC" });

export function HomePage() {
  const investigationState = useInvestigationData();
  const { municipalities } = useMunicipalities();
  const sobral = municipalities.find((city) => city.slug === "sobral");
  const employment = sobral?.formal_employment;

  return (
    <main id="conteudo">
      <section className="hero">
        <div className="hero-copy">
          <p className="hero-context">Ceará · crédito, renda e trabalho</p>
          <h1>Como as dívidas pesam na vida das pessoas?</h1>
          <p className="hero-lead">
            Entenda o que pressiona o orçamento em Fortaleza e como o atraso varia com a renda e o trabalho no Ceará.
          </p>
          <div className="hero-actions">
            <a className="button button-light" href="#resumo-ceara">Entender o impacto nas pessoas</a>
            <Link className="button button-ghost" to="/cidades">
              Explorar minha cidade
            </Link>
          </div>
        </div>
        <EditorialArt name="contas-em-casa" sizes="(max-width: 920px) 100vw, 50vw" />
      </section>

      <PopulationDebtSection />

      {investigationState.status === "loading" ? (
        <section className="content-section" aria-live="polite">
          <div className="data-state">
            <h2>Carregando os dados do Ceará</h2>
          </div>
        </section>
      ) : null}

      {investigationState.status === "error" ? (
        <section className="content-section" role="alert">
          <div className="data-state data-state-error">
            <h2>O resumo do Ceará está indisponível</h2>
            <p>{investigationState.error}</p>
          </div>
        </section>
      ) : null}

      {investigationState.status === "ready" ? (
        <InvestigationChapters
          macro={investigationState.macro}
          profiles={investigationState.profiles}
          labor={investigationState.labor}
        />
      ) : null}

      <section className="content-section city-invitation" id="cidades">
        <div>
          <SectionHeader
            marker="Território · 184 municípios"
            title="O que sabemos sobre sua cidade?"
            description="Veja quantas pessoas moram lá, a renda por pessoa e quais ocupações ganharam ou perderam postos com carteira assinada."
          />
          <Link className="button button-dark" to="/cidades?cidade=sobral">
            Abrir o explorador municipal
          </Link>
        </div>
        <div>
          <EditorialArt name="praca-cearense" sizes="(max-width: 920px) 100vw, 450px" />
          {sobral && employment && (
          <div className="coverage-preview" aria-label="Resumo de Sobral">
            <p>Exemplo · Sobral</p>
            <strong>{currency.format(sobral.income_pc_median_2022)}</strong>
            <span>Metade dos moradores tinha renda por pessoa de até esse valor por mês em 2022.</span>
            <small>
              {employment.balance === 0
                ? "Contratações e desligamentos ficaram empatados"
                : `${integer.format(Math.abs(employment.balance))} postos com carteira assinada ${employment.balance > 0 ? "a mais" : "a menos"}`}
              {" em "}{month.format(new Date(`${employment.period}-01T00:00:00Z`))}.
            </small>
          </div>
          )}
        </div>
      </section>

      <section className="content-section method-callout">
        <h2>De onde vêm os números?</h2>
        <Link className="text-link text-link-light" to="/metodo">
          Consultar fontes, cálculos e dados para baixar
        </Link>
      </section>
    </main>
  );
}
