import { Link } from "react-router-dom";
import { BreathingGraphic } from "../components/BreathingGraphic";
import { InvestigationChapters } from "../components/InvestigationChapters";
import { SectionHeader } from "../components/SectionHeader";
import { useInvestigationData } from "../data/useInvestigationData";

export function HomePage() {
  const investigationState = useInvestigationData();

  return (
    <main id="conteudo">
      <section className="hero">
        <div className="hero-copy">
          <p className="hero-context">Ceará · crédito, renda e trabalho</p>
          <h1>Como estão as dívidas no Ceará?</h1>
          <p className="hero-lead">
            Veja quanto ainda falta pagar em crédito, onde as parcelas atrasam mais e o que os dados mostram sobre sua cidade.
          </p>
          <div className="hero-actions">
            <a className="button button-light" href="#resumo-ceara">Ver resumo do Ceará</a>
            <Link className="button button-ghost" to="/cidades">
              Explorar minha cidade
            </Link>
          </div>
        </div>
        <div className="hero-visual">
          <BreathingGraphic />
        </div>
      </section>

      {investigationState.status === "loading" ? (
        <section className="content-section" id="resumo-ceara" aria-live="polite">
          <div className="data-state">
            <h2>Carregando os dados do Ceará</h2>
          </div>
        </section>
      ) : null}

      {investigationState.status === "error" ? (
        <section className="content-section" id="resumo-ceara" role="alert">
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
            description="Veja quantas pessoas moram lá, quanto ganham e quais ocupações mais ganharam ou perderam empregos formais."
          />
          <Link className="button button-dark" to="/cidades?cidade=sobral">
            Abrir o explorador municipal
          </Link>
        </div>
        <div className="coverage-preview" aria-label="Resumo da ficha de Sobral">
          <p>Ficha municipal · Sobral</p>
          <strong>R$ 650</strong>
          <span>Renda por pessoa no meio da distribuição (Censo 2022) · +454 empregos formais (set/2026)</span>
          <small>Endividamento dos moradores: dado municipal indisponível</small>
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
