import styled from "styled-components";

export const Screen = styled.div`
  width: 100%;
  height: 100%;
  background: #f5f6fa;
  overflow-y: auto;
  overflow-x: hidden;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
  box-sizing: border-box;
`;

export const TopBar = styled.div`
  background: #ffffff;
  padding: 14px 16px 10px;
  border-bottom: 0.5px solid rgba(0, 0, 0, 0.08);
  position: sticky;
  top: 0;
  z-index: 5;
`;

export const TopBarTitle = styled.p`
  font-size: 16px;
  font-weight: 500;
  color: #111827;
  margin: 0;
`;

export const TopBarSub = styled.p`
  font-size: 12px;
  color: #6b7280;
  margin: 2px 0 0;
`;

export const Content = styled.div`
  padding: 12px 14px 24px;
`;

export const Card = styled.div`
  background: #ffffff;
  border: 0.5px solid rgba(0, 0, 0, 0.08);
  border-radius: 14px;
  padding: 14px;
  margin-bottom: 10px;
`;

export const Label = styled.p`
  font-size: 11px;
  color: #6b7280;
  margin: 0 0 8px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

export const Divider = styled.hr`
  border: none;
  border-top: 0.5px solid rgba(0, 0, 0, 0.08);
  margin: 10px 0;
`;

/* ── Cycle selector ──────────────────────────────────────────── */

export const CycleCheckboxRow = styled.div`
  display: flex;
  gap: 6px;
  flex-wrap: nowrap;
  overflow-x: auto;
`;

interface CycleChipProps {
  $active?: boolean;
}

export const CycleChip = styled.button<CycleChipProps>`
  flex: 1;
  min-width: 48px;
  padding: 8px 6px;
  border: 1.5px solid ${(p) => (p.$active ? "#2563eb" : "rgba(0,0,0,0.10)")};
  border-radius: 10px;
  font-size: 12px;
  color: ${(p) => (p.$active ? "#ffffff" : "#6b7280")};
  background: ${(p) => (p.$active ? "#2563eb" : "#ffffff")};
  cursor: pointer;
  font-weight: ${(p) => (p.$active ? "600" : "400")};
  transition: all 0.15s;
  white-space: nowrap;
  text-align: center;
  &:active {
    opacity: 0.8;
  }
`;

/* ── Bloco Técnica (compacto: só a altura é menor) ───────────── */

export const TecnicaCard = styled(Card)`
  padding: 10px 14px;
`;

export const TecnicaLabel = styled(Label)`
  margin-bottom: 6px;
`;

export const TecnicaChip = styled(CycleChip)`
  padding: 6px 6px;
`;

/* ── Session selector ────────────────────────────────────────── */

export const SessaoRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 4px;
`;

/* ── First-use banner ────────────────────────────────────────── */

export const FirstUseCloud = styled.div`
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 12px;
  padding: 12px 14px;
  margin-bottom: 12px;
  font-size: 13px;
  color: #1d4ed8;
  line-height: 1.5;
`;

/* ── Multiselect ─────────────────────────────────────────────── */

export const MultiSelectWrapper = styled.div`
  position: relative;
`;

export const MultiSelectInput = styled.input`
  width: 100%;
  background: #f5f6fa;
  border: 0.5px solid rgba(0, 0, 0, 0.12);
  border-radius: 10px;
  padding: 10px 12px;
  font-size: 13px;
  color: #111827;
  box-sizing: border-box;
  &:focus {
    outline: none;
    border-color: #2563eb;
  }
  &::placeholder {
    color: #9ca3af;
  }
`;

export const DropdownList = styled.ul`
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  background: #ffffff;
  border: 0.5px solid rgba(0, 0, 0, 0.12);
  border-radius: 10px;
  padding: 4px 0;
  margin: 0;
  list-style: none;
  z-index: 20;
  max-height: 200px;
  overflow-y: auto;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
`;

export const DropdownItem = styled.li`
  padding: 9px 12px;
  font-size: 13px;
  color: #111827;
  cursor: pointer;
  &:hover {
    background: #eff6ff;
    color: #2563eb;
  }
`;

export const TagsRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 8px;
`;

export const ExerciseTag = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  background: #eff6ff;
  border: 0.5px solid #93c5fd;
  border-radius: 8px;
  padding: 4px 8px;
  font-size: 12px;
  color: #2563eb;
`;

export const TagRemove = styled.button`
  background: none;
  border: none;
  color: #2563eb;
  font-size: 14px;
  line-height: 1;
  padding: 0;
  cursor: pointer;
  display: flex;
  align-items: center;
  opacity: 0.7;
  &:hover {
    opacity: 1;
  }
`;

/* ── Exercise card ───────────────────────────────────────────── */

export const ExerciseCard = styled.div`
  background: #ffffff;
  border: 0.5px solid rgba(0, 0, 0, 0.08);
  border-radius: 14px;
  padding: 14px;
  margin-bottom: 10px;
`;

export const ExHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
`;

export const ExName = styled.p`
  font-size: 15px;
  font-weight: 500;
  color: #111827;
  margin: 0 0 2px;
`;

export const ExSub = styled.p`
  font-size: 11px;
  color: #6b7280;
  margin: 0;
`;

export const Badge = styled.span`
  display: inline-block;
  font-size: 10px;
  padding: 2px 7px;
  border-radius: 6px;
  background: #eff6ff;
  color: #2563eb;
  white-space: nowrap;
`;

/* ── Suggestion banner ───────────────────────────────────────── */

export const SugestaoMsg = styled.div`
  background: #f0f9ff;
  border: 0.5px solid #bae6fd;
  border-radius: 8px;
  padding: 8px 10px;
  font-size: 12px;
  color: #0369a1;
  margin-bottom: 10px;
`;

/* ── Series inputs ───────────────────────────────────────────── */

export const SeriesGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 4px;
`;

export const SerieRow = styled.div`
  display: flex;
  gap: 6px;
  align-items: center;
`;

export const SerieLabel = styled.span`
  font-size: 11px;
  color: #6b7280;
  width: 44px;
  flex-shrink: 0;
`;

interface InputBoxProps {
  $invalid?: boolean;
  $isSuggestion?: boolean;
}

export const InputBox = styled.input<InputBoxProps>`
  flex: 1;
  background: #f5f6fa;
  border: 0.5px solid ${(p) => (p.$invalid ? "#ef4444" : p.$isSuggestion ? "#93c5fd" : "rgba(0,0,0,0.08)")};
  border-radius: 10px;
  padding: 13px 12px;
  font-size: 16px;
  color: ${(p) => (p.$isSuggestion ? "#2563eb" : "#111827")};
  min-width: 0;
  box-sizing: border-box;
  outline: ${(p) => (p.$invalid ? "2px solid #fca5a5" : "none")};
  &:focus {
    outline: none;
    border-color: #2563eb;
    color: #111827;
  }
  &::placeholder {
    color: #d1d5db;
  }
`;

export const InputSm = styled.input<InputBoxProps>`
  width: 62px;
  flex-shrink: 0;
  background: #f5f6fa;
  border: 0.5px solid ${(p) => (p.$invalid ? "#ef4444" : p.$isSuggestion ? "#93c5fd" : "rgba(0,0,0,0.08)")};
  border-radius: 10px;
  padding: 13px 8px;
  font-size: 16px;
  color: ${(p) => (p.$isSuggestion ? "#2563eb" : "#111827")};
  text-align: center;
  box-sizing: border-box;
  outline: ${(p) => (p.$invalid ? "2px solid #fca5a5" : "none")};
  &:focus {
    outline: none;
    border-color: #2563eb;
    color: #111827;
  }
  &::placeholder {
    color: #d1d5db;
  }
`;

export const Unit = styled.span`
  font-size: 11px;
  color: #6b7280;
  width: 28px;
  flex-shrink: 0;
`;

/* ── Obs field ───────────────────────────────────────────────── */

export const ObsInput = styled.textarea`
  width: 100%;
  background: #f5f6fa;
  border: 0.5px solid rgba(0, 0, 0, 0.08);
  border-radius: 10px;
  padding: 10px 12px;
  font-size: 13px;
  color: #111827;
  box-sizing: border-box;
  resize: none;
  font-family: inherit;
  &:focus {
    outline: none;
    border-color: #2563eb;
  }
  &::placeholder {
    color: #9ca3af;
  }
`;

/* ── Save button ─────────────────────────────────────────────── */

export const SaveBtn = styled.button<{ $disabled?: boolean }>`
  width: 100%;
  padding: 13px;
  background: ${(p) => (p.$disabled ? "#e5e7eb" : "#2563eb")};
  color: ${(p) => (p.$disabled ? "#9ca3af" : "#ffffff")};
  border: none;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 600;
  cursor: ${(p) => (p.$disabled ? "not-allowed" : "pointer")};
  margin-top: 12px;
  transition: background 0.15s;
  &:active {
    opacity: ${(p) => (p.$disabled ? 1 : 0.85)};
  }
`;

/* ── Toast / success banner ─────────────────────────────────── */

interface ToastBannerProps {
  $variant?: "success" | "error";
}

export const ToastBanner = styled.div<ToastBannerProps>`
  background: ${(p) => (p.$variant === "error" ? "#fef2f2" : "#dcfce7")};
  border: 0.5px solid ${(p) => (p.$variant === "error" ? "#fecaca" : "#86efac")};
  border-radius: 10px;
  padding: 12px 14px;
  font-size: 13px;
  color: ${(p) => (p.$variant === "error" ? "#991b1b" : "#166534")};
  text-align: center;
  margin-bottom: 10px;
  font-weight: 600;
`;

/* ── Date input ──────────────────────────────────────────────── */

export const DateInput = styled.input`
  background: none;
  border: none;
  font-size: 12px;
  color: #6b7280;
  padding: 0;
  margin: 2px 0 0;
  cursor: pointer;
  font-family: inherit;
  &:focus {
    outline: none;
    color: #2563eb;
  }
`;

/* ── PerformFit: séries por checkbox e botões grandes ────────── */

export const SeriesChecks = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  justify-content: center;
  margin: 12px 0 8px;
`;

export const SerieCheck = styled.button<{ $checked: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  font-family: inherit;

  & > span:first-child {
    width: 64px;
    height: 64px;
    border-radius: 14px;
    border: 2.5px solid ${(p) => (p.$checked ? "#16a34a" : "#9ca3af")};
    background: ${(p) => (p.$checked ? "#16a34a" : "#ffffff")};
    color: #ffffff;
    font-size: 34px;
    font-weight: 700;
    line-height: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.15s;
  }

  & > span:last-child {
    font-size: 15px;
    font-weight: 600;
    color: ${(p) => (p.$checked ? "#166534" : "#374151")};
  }

  &:active > span:first-child {
    transform: scale(0.95);
  }
`;

export const ProgressoSeries = styled.p<{ $completo: boolean }>`
  text-align: center;
  font-size: 16px;
  font-weight: 600;
  color: ${(p) => (p.$completo ? "#16a34a" : "#6b7280")};
  margin: 4px 0;
`;

export const BigBtn = styled.button<{ $variant: "primario" | "concluido" | "secundario" }>`
  min-height: 56px;
  padding: 12px 16px;
  border-radius: 12px;
  font-size: 18px;
  font-weight: 700;
  font-family: inherit;
  cursor: pointer;
  border: ${(p) => (p.$variant === "secundario" ? "1.5px solid #d1d5db" : "none")};
  background: ${(p) =>
    p.$variant === "concluido" ? "#16a34a" : p.$variant === "primario" ? "#2563eb" : "#ffffff"};
  color: ${(p) => (p.$variant === "secundario" ? "#4b5563" : "#ffffff")};
  box-shadow: ${(p) => (p.$variant === "concluido" ? "0 0 0 4px rgba(22, 163, 74, 0.25)" : "none")};
  transition: background 0.15s, box-shadow 0.15s;
  &:active {
    opacity: 0.85;
  }
`;

export const NavBtn = styled.button`
  flex: 1;
  min-height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  border: 1.5px solid #2563eb;
  background: #eff6ff;
  color: #2563eb;
  font-size: 16px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  &:disabled {
    border-color: #e5e7eb;
    background: #f9fafb;
    color: #d1d5db;
    cursor: default;
  }
`;
