import { createBrowserRouter } from "react-router-dom";
import { AppLayout } from "./components/AppLayout";
import { CitiesPage } from "./pages/CitiesPage";
import { HomePage } from "./pages/HomePage";
import { MethodPage } from "./pages/MethodPage";
import { NotFoundPage } from "./pages/NotFoundPage";

export const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      { path: "/", element: <HomePage /> },
      { path: "/cidades", element: <CitiesPage /> },
      { path: "/metodo", element: <MethodPage /> },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
]);

