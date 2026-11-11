import { Link } from "react-router-dom";
import { BreathingGraphic } from "../components/BreathingGraphic";
import { InvestigationChapters } from "../components/InvestigationChapters";
import { SectionHeader } from "../components/SectionHeader";
import { useInvestigationData } from "../data/useInvestigationData";

const concepts = [
  {
    title: "Ter dívida",
    description:
      "É ter um compromisso a pagar, inclusive quando as parcelas estão rigorosamente em dia.",
  },
  {
    title: "Estar em atraso",
    description:
      "Depende da regra de cada fonte. Um atraso de 15 dias não equivale automaticamente a 90 dias.",
  },
  {
    title: "Comprometer a renda",
    description:
      "Relaciona pagamentos e renda em um universo definido; não mede sozinho dificuldade financeira.",
  },
];

export function HomePage() {
  const investigationState = useInvestigationData();

  return (
    <main id="conteudo">
      <section className="hero">
        <div className="hero-copy">
          <p className="hero-context">Ceará, Nordeste e Brasil · investigação com dados oficiais</p>
          <h1>Quanto espaço sobra no orçamento?</h1>
          <p className="hero-lead">
            Uma experiência para entender o que dívida, atraso e renda dizem — e o que não
            dizem — sobre cada território.
          </p>
          <div className="hero-actions">
            <Link className="button button-light" to="/cidades">
              Explorar cidades
            </Link>
            <Link className="button button-ghost" to="/metodo">
              Entender os indicadores
            </Link>
          </div>
          <p className="prototype-label">
            Séries oficiais reconciliadas (2019–2026) · 872 observações auditadas e 184 municípios
          </p>
        </div>
        <div className="hero-visual">
          <BreathingGraphic />
          <p>Espaço para respirar, sem codificação de dados</p>
        </div>
      </section>

      <section className="content-section concept-section">
        <SectionHeader
          marker="Antes dos números"
          title="Três formas de olhar a dívida."
          description="As fontes observam fenômenos diferentes. A aplicação começa deixando essa diferença visível."
        />
        <div className="concept-grid">
          {concepts.map((concept, index) => (
            <article key={concept.title}>
              <span className="concept-number">0{index + 1}</span>
              <h3>{concept.title}</h3>
              <p>{concept.description}</p>
            </article>
          ))}
        </div>
      </section>

      {investigationState.status === "loading" ? (
        <section className="content-section" id="panorama" aria-live="polite">
          <div className="data-state">
            <h2>Carregando séries estaduais, regionais e nacionais</h2>
            <p>Conferindo pacotes validados do BCB, IBGE, MTE, CNC e Fecomércio-CE.</p>
          </div>
        </section>
      ) : null}

      {investigationState.status === "error" ? (
        <section className="content-section" id="panorama" role="alert">
          <div className="data-state data-state-error">
            <h2>Não foi possível carregar os capítulos investigativos</h2>
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
            title="Cada cidade tem uma história — e uma cobertura."
            description="População, renda domiciliar (mediana e média) e emprego formal por ocupação estão disponíveis para os 184 municípios. O endividamento dos moradores ainda não possui fonte municipal validada."
          />
          <Link className="button button-dark" to="/cidades?cidade=sobral">
            Abrir o explorador municipal
          </Link>
        </div>
        <div className="coverage-preview" aria-label="Resumo da ficha de Sobral">
          <p>Ficha municipal · Sobral</p>
          <strong>R$ 650</strong>
          <span>Renda per capita mediana (Censo 2022) · +454 empregos formais (set/2026)</span>
          <small>Endividamento dos moradores: dado municipal indisponível</small>
        </div>
      </section>

      <section className="content-section method-callout">
        <p>Dívida não é sinônimo de dificuldade financeira.</p>
        <h2>O produto não transforma operações em pessoas, nem ausência em zero.</h2>
        <Link className="text-link text-link-light" to="/metodo">
          Ler os compromissos metodológicos e baixar dados
        </Link>
      </section>
    </main>
  );
}
