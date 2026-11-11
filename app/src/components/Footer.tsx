import { Link } from "react-router-dom";

export function Footer() {
  return (
    <footer className="site-footer">
      <div>
        <strong>fôlego.</strong>
        <p>Dados sobre crédito, renda e emprego no Ceará.</p>
      </div>
      <div className="footer-links">
        <Link to="/metodo">Fontes e cálculos</Link>
        <a href="https://github.com/NicolasDev-web/Folego">Código e documentação</a>
      </div>
    </footer>
  );
}

