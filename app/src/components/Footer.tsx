import { Link } from "react-router-dom";

export function Footer() {
  return (
    <footer className="site-footer">
      <div>
        <strong>fôlego.</strong>
        <p>Uma investigação em construção sobre dívidas, renda e território.</p>
      </div>
      <div className="footer-links">
        <Link to="/metodo">Como ler os dados</Link>
        <a href="https://github.com/NicolasDev-web/Folego">Código e documentação</a>
      </div>
    </footer>
  );
}

