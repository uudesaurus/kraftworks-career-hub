import { createRoot } from "react-dom/client";
import ErrorBoundary from "./components/ErrorBoundary";
import EmployerApp from "./EmployerApp";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <EmployerApp />
  </ErrorBoundary>
);
