import { Link } from "react-router-dom";

export function NotFoundPage() {
  return (
    <main id="conteudo" className="not-found">
      <h1>Página não encontrada</h1>
      <Link className="button button-dark" to="/">
        Voltar para o início
      </Link>
    </main>
  );
}

