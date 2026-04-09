import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import AppErrorBoundary from "./components/AppErrorBoundary";
import { initializeTheme } from "./lib/theme";

initializeTheme();

createRoot(document.getElementById("root")!).render(
	<AppErrorBoundary>
		<App />
	</AppErrorBoundary>
);
