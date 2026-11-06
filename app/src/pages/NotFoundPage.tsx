import { Link } from "react-router-dom";

export function NotFoundPage() {
  return (
    <main id="conteudo" className="not-found">
      <p className="section-marker">Página não encontrada</p>
      <h1>Este caminho ainda não faz parte da investigação.</h1>
      <Link className="button button-dark" to="/">
        Voltar ao panorama
      </Link>
    </main>
  );
}

