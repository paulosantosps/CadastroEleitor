import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "./lib/auth";
import { Layout } from "./components/Layout";
import { Login } from "./pages/Login";
import { ResetPassword } from "./pages/ResetPassword";
import { Cadastrar } from "./pages/Cadastrar";
import { Moradores } from "./pages/Moradores";
import { MoradorDetail } from "./pages/MoradorDetail";

function Protected({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();
  if (loading) return <p className="p-6 text-sm text-ink/50">Carregando...</p>;
  if (!session) return <Navigate to="/login" replace />;
  return <Layout>{children}</Layout>;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route
            path="/"
            element={
              <Protected>
                <Cadastrar />
              </Protected>
            }
          />
          <Route
            path="/moradores"
            element={
              <Protected>
                <Moradores />
              </Protected>
            }
          />
          <Route
            path="/moradores/:id"
            element={
              <Protected>
                <MoradorDetail />
              </Protected>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
