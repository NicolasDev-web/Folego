import { Outlet, ScrollRestoration } from "react-router-dom";
import { Footer } from "./Footer";
import { Header } from "./Header";

export function AppLayout() {
  return (
    <div className="app-shell">
      <Header />
      <Outlet />
      <Footer />
      <ScrollRestoration />
    </div>
  );
}

