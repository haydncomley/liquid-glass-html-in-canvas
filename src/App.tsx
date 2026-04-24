import { Navigate, Route, Routes } from "react-router-dom";
import { LiquidGlassProvider } from "./components/liquid-glass-provider";
import { Home } from "./pages/home";
import { SettingsPage } from "./pages/settings";
import "./App.scss";
import { DashboardPage } from "./pages/dashboard";

function App() {
  return (
    <LiquidGlassProvider>
      <main>
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/article" element={<Home />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </LiquidGlassProvider>
  );
}

export default App;
