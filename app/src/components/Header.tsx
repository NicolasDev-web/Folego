import { NavLink } from "react-router-dom";

const navItems = [
  { label: "Panorama", to: "/#panorama" },
  { label: "Cidades", to: "/cidades" },
  { label: "Evolução", to: "/#evolucao" },
  { label: "Dívidas", to: "/#dividas" },
  { label: "Método", to: "/metodo" },
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

