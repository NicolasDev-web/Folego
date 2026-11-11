import { NavLink } from "react-router-dom";

const navItems = [
  { label: "Resumo", to: "/#resumo-ceara" },
  { label: "Cidades", to: "/cidades" },
  { label: "Ao longo do tempo", to: "/#evolucao" },
  { label: "Renda e dívidas", to: "/#dividas" },
  { label: "Fontes e cálculos", to: "/metodo" },
];

function Navigation() {
  return (
    <nav aria-label="Navegação principal">
      {navItems.map((item) => (
        <NavLink key={item.label} to={item.to}>
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
}

export function Header() {
  return (
    <header className="site-header">
      <NavLink className="brand" to="/" aria-label="Fôlego, página inicial">
        <strong>fôlego.</strong>
        <span>Dívidas, renda e território</span>
      </NavLink>
      <div className="desktop-navigation">
        <Navigation />
      </div>
      <NavLink className="header-cta" to="/cidades">
        Buscar cidade
      </NavLink>
      <details className="mobile-navigation">
        <summary>Menu</summary>
        <Navigation />
      </details>
    </header>
  );
}

