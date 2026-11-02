import styled from "styled-components";
import { Dumbbell, CalendarCheck, TrendingUp, User } from "lucide-react";
import type { ReactNode } from "react";

export type Tab = "treinar" | "semana" | "evolucao" | "perfil";

interface BottomNavProps {
  active: Tab;
  onChange: (tab: Tab) => void;
}

const Nav = styled.nav`
  position: relative;
  min-height: 72px;
  background: #ffffff;
  border-top: 0.5px solid rgba(0, 0, 0, 0.08);
  display: flex;
  align-items: center;
  justify-content: space-around;
  padding: 0 4px calc(8px + env(safe-area-inset-bottom));
  flex-shrink: 0;
`;

const NavItem = styled.button<{ $active: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  min-height: 56px;
  padding: 6px 8px;
  border-radius: 10px;
  flex: 1;
  border: none;
  background: ${(p) => (p.$active ? "#eff6ff" : "none")};
`;

const NavIcon = styled.span<{ $active: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${(p) => (p.$active ? "#2563eb" : "#9ca3af")};
  line-height: 1;
`;

const NavLabel = styled.span<{ $active: boolean }>`
  font-size: 14px;
  color: ${(p) => (p.$active ? "#2563eb" : "#9ca3af")};
  font-weight: ${(p) => (p.$active ? "500" : "400")};
`;

const ITEMS: { id: Tab; label: string; icon: ReactNode }[] = [
  { id: "treinar", label: "Treinar", icon: <Dumbbell size={26} strokeWidth={1.8} /> },
  { id: "semana", label: "Semana", icon: <CalendarCheck size={26} strokeWidth={1.8} /> },
  { id: "evolucao", label: "Evolução", icon: <TrendingUp size={26} strokeWidth={1.8} /> },
  { id: "perfil", label: "Perfil", icon: <User size={26} strokeWidth={1.8} /> },
];

export default function BottomNav({ active, onChange }: BottomNavProps) {
  return (
    <Nav aria-label="Navegação principal">
      {ITEMS.map((item) => (
        <NavItem
          key={item.id}
          type="button"
          $active={active === item.id}
          aria-current={active === item.id ? "page" : undefined}
          onClick={() => onChange(item.id)}
        >
          <NavIcon $active={active === item.id} aria-hidden="true">{item.icon}</NavIcon>
          <NavLabel $active={active === item.id}>{item.label}</NavLabel>
        </NavItem>
      ))}
    </Nav>
  );
}
