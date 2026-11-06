import { Link } from "react-router-dom";

const commitments = [
  "Não transformar média estadual ou sub-regional em dado municipal.",
  "Não tratar operações, pessoas e famílias como se fossem o mesmo universo.",
  "Não preencher valores ausentes com zero.",
  "Exibir fonte, competência, unidade, universo e território em cada indicador.",
];

export function MethodPage() {
  return (
    <main id="conteudo" className="method-page">
      <header className="page-intro method-intro">
        <p className="section-marker">Método em linguagem direta</p>
        <h1>Um número só é útil quando você sabe o que ele mede.</h1>
        <p>
          Fôlego separa saldo, atraso, renda e percepção. Cada medida preserva a definição e a
          escala da fonte original.
        </p>
      </header>

      <section className="method-grid" aria-label="Compromissos do projeto">
        {commitments.map((commitment, index) => (
          <article key={commitment}>
            <span>{String(index + 1).padStart(2, "0")}</span>
            <p>{commitment}</p>
          </article>
        ))}
      </section>

      <section className="method-detail">
        <div>
          <h2>Da fonte à tela</h2>
          <p>
            A coleta registra versão e data, valida o grão dos dados, preserva ausências e só
            publica agregados compatíveis. Quebras metodológicas aparecem junto das séries.
          </p>
        </div>
        <aside>
          <p>Documentação completa</p>
          <a href="https://github.com/NicolasDev-web/Folego/blob/main/01_contexto/METODOLOGIA_DIDATICA.md">
            Metodologia didática
          </a>
          <a href="https://github.com/NicolasDev-web/Folego/blob/main/04_tecnico/CONTRATO_DADOS.json">
            Contrato de dados
          </a>
        </aside>
      </section>

      <Link className="button button-dark" to="/cidades">
        Ver a cobertura municipal
      </Link>
    </main>
  );
}

