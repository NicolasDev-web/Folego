import { Link } from "react-router-dom";
import { BreathingGraphic } from "../components/BreathingGraphic";
import { SectionHeader } from "../components/SectionHeader";

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
  return (
    <main id="conteudo">
      <section className="hero">
        <div className="hero-copy">
          <p className="hero-context">Ceará e Brasil · investigação em construção</p>
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
            Primeira versão funcional · ainda sem resultados estatísticos publicados
          </p>
        </div>
        <div className="hero-visual">
          <BreathingGraphic />
          <p>Espaço para respirar, sem codificação de dados</p>
        </div>
      </section>

      <section className="content-section concept-section" id="panorama">
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

      <section className="content-section city-invitation" id="cidades">
        <div>
          <SectionHeader
            marker="Território"
            title="Cada cidade tem uma história — e uma cobertura."
            description="A ausência de uma taxa municipal validada também é informação. A ficha mostra a escala, a fonte e o limite antes de qualquer comparação."
          />
          <Link className="button button-dark" to="/cidades?cidade=sobral">
            Abrir o piloto municipal
          </Link>
        </div>
        <div className="coverage-preview" aria-label="Exemplo de ficha sem dado">
          <p>Ficha municipal</p>
          <strong>Sobral</strong>
          <span>—</span>
          <small>Taxa de dívida municipal direta ainda não disponível</small>
        </div>
      </section>

      <section className="content-section evidence-section" id="evolucao">
        <SectionHeader
          marker="Evolução"
          title="A série virá depois da evidência."
          description="Gráficos só entram quando fonte, unidade, período, universo e geografia estiverem validados. Até lá, a interface explica o que está pendente."
        />
        <div className="evidence-frame">
          <div className="evidence-line" />
          <p>Área reservada para séries observadas e quebras metodológicas documentadas.</p>
        </div>
      </section>

      <section className="content-section method-callout" id="dividas">
        <p>Dívida não é sinônimo de dificuldade financeira.</p>
        <h2>O produto não vai transformar operações em pessoas, nem ausência em zero.</h2>
        <Link className="text-link text-link-light" to="/metodo">
          Ler os compromissos metodológicos
        </Link>
      </section>
    </main>
  );
}

