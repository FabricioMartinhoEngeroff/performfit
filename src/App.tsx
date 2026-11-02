import { useState, useCallback } from "react";
import styled from "styled-components";
import { useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";
import TreinoSessao from "./components/treinoSessao/TreinoSessao";
import Semana from "./components/semana/Semana";
import Evolucao from "./components/evolucao/Evolucao";
import Perfil from "./components/perfil/Perfil";
import BottomNav, { type Tab } from "./components/layout/BottomNav";
import { useAuth } from "./components/login/context/useAuth";

const Shell = styled.div`
  display: flex;
  flex-direction: column;
  width: 100vw;
  height: 100dvh;
  overflow: hidden;
  background: #f5f6fa;
`;

const TopBar = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  height: 48px;
  background: #1e40af;
  flex-shrink: 0;
`;

const UserLabel = styled.span`
  font-size: 15px;
  font-weight: 500;
  color: #dbeafe;
`;

const LogoutBtn = styled.button`
  display: flex;
  align-items: center;
  gap: 4px;
  background: none;
  border: none;
  cursor: pointer;
  color: #dbeafe;
  font-size: 15px;
  min-height: 40px;
  padding: 4px 10px;
  border-radius: 6px;
  &:hover {
    background: rgba(255, 255, 255, 0.15);
  }
`;

const TabContent = styled.div`
  flex: 1;
  overflow: hidden;
  position: relative;
`;


export default function App() {
  const [tab, setTab] = useState<Tab>("treinar");
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const navigate = useNavigate();

  const { user, signOut } = useAuth();

  const handleTabChange = useCallback(
    (newTab: Tab) => {
      if (newTab !== "treinar" && unsavedChanges) {
        if (!window.confirm("Você tem alterações não salvas. Sair mesmo assim?")) return;
      }
      setTab(newTab);
    },
    [unsavedChanges]
  );

  const handleLogout = async () => {
    await signOut();
    navigate("/", { replace: true });
  };

  return (
    <Shell>
      <TopBar>
        <UserLabel>Olá, {user?.name || "Usuário"}</UserLabel>
        <LogoutBtn onClick={handleLogout}>
          <LogOut size={18} />
          Sair
        </LogoutBtn>
      </TopBar>
      <TabContent>
        {tab === "treinar" && <TreinoSessao onUnsavedChanges={setUnsavedChanges} />}
        {tab === "semana" && <Semana />}
        {tab === "evolucao" && <Evolucao />}
        {tab === "perfil" && <Perfil />}
      </TabContent>
      <BottomNav active={tab} onChange={handleTabChange} />
    </Shell>
  );
}
