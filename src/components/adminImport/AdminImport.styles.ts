import styled from "styled-components";

export const Screen = styled.div`
  width: 100%;
  min-height: 100vh;
  background: #f5f6fa;
  padding: 24px 16px 48px;
  box-sizing: border-box;
`;

export const Header = styled.div`
  margin-bottom: 20px;
`;

export const Title = styled.h1`
  font-size: 20px;
  font-weight: 600;
  color: #111827;
  margin: 0 0 4px;
`;

export const Subtitle = styled.p`
  font-size: 13px;
  color: #6b7280;
  margin: 0;
`;

/* ── Drop zone ───────────────────────────────────────────────── */

interface DropZoneProps {
  $dragging?: boolean;
}

export const DropZone = styled.div<DropZoneProps>`
  border: 2px dashed ${(p) => (p.$dragging ? "#2563eb" : "#93c5fd")};
  border-radius: 14px;
  background: ${(p) => (p.$dragging ? "#eff6ff" : "#ffffff")};
  padding: 32px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  transition: all 0.15s;
  margin-bottom: 16px;

  &:hover {
    border-color: #2563eb;
    background: #eff6ff;
  }
`;

export const DropIcon = styled.div`
  font-size: 36px;
  line-height: 1;
`;

export const DropText = styled.p`
  font-size: 14px;
  color: #2563eb;
  font-weight: 500;
  margin: 0;
  text-align: center;
`;

export const DropSub = styled.p`
  font-size: 12px;
  color: #9ca3af;
  margin: 0;
`;

export const HiddenInput = styled.input`
  display: none;
`;

export const FileName = styled.div`
  font-size: 12px;
  color: #059669;
  background: #d1fae5;
  border: 0.5px solid #6ee7b7;
  border-radius: 8px;
  padding: 6px 12px;
  margin-bottom: 16px;
  display: inline-block;
`;

/* ── Preview table ───────────────────────────────────────────── */

export const SectionLabel = styled.p`
  font-size: 11px;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin: 0 0 8px;
`;

export const TableWrap = styled.div`
  overflow-x: auto;
  border-radius: 12px;
  border: 0.5px solid rgba(0, 0, 0, 0.08);
  margin-bottom: 16px;
`;

export const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
  background: #ffffff;
`;

export const Th = styled.th`
  padding: 9px 10px;
  background: #f9fafb;
  color: #6b7280;
  font-weight: 500;
  text-align: left;
  border-bottom: 0.5px solid rgba(0, 0, 0, 0.08);
  white-space: nowrap;
`;

export const Td = styled.td`
  padding: 8px 10px;
  color: #111827;
  border-bottom: 0.5px solid rgba(0, 0, 0, 0.05);
  white-space: nowrap;

  &:last-child {
    border-bottom: none;
  }
`;

export const Tr = styled.tr`
  &:last-child td {
    border-bottom: none;
  }
`;

export const PesoBadge = styled.span`
  display: inline-block;
  background: #eff6ff;
  color: #2563eb;
  border-radius: 6px;
  padding: 2px 6px;
  font-size: 11px;
  font-weight: 500;
`;

export const EmptyBadge = styled.span`
  color: #d1d5db;
  font-size: 11px;
`;

/* ── Result / feedback ───────────────────────────────────────── */

export const ResultCard = styled.div`
  background: #d1fae5;
  border: 0.5px solid #6ee7b7;
  border-radius: 12px;
  padding: 14px 16px;
  margin-bottom: 16px;
`;

export const ResultTitle = styled.p`
  font-size: 14px;
  font-weight: 600;
  color: #065f46;
  margin: 0 0 8px;
`;

export const ResultRow = styled.p`
  font-size: 13px;
  color: #047857;
  margin: 2px 0;
`;

/* ── Action buttons ──────────────────────────────────────────── */

export const BtnRow = styled.div`
  display: flex;
  gap: 10px;
  margin-top: 4px;
`;

export const BtnPrimary = styled.button`
  flex: 1;
  padding: 13px;
  background: #2563eb;
  color: #ffffff;
  border: none;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.15s;

  &:disabled {
    background: #e5e7eb;
    color: #9ca3af;
    cursor: not-allowed;
  }

  &:not(:disabled):active {
    opacity: 0.85;
  }
`;

export const BtnDanger = styled.button`
  padding: 13px 20px;
  background: none;
  color: #ef4444;
  border: 1px solid #fca5a5;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s;

  &:active {
    background: #fef2f2;
  }
`;

export const BtnWarning = styled.button`
  padding: 13px 20px;
  background: none;
  color: #d97706;
  border: 1px solid #fcd34d;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s;

  &:active {
    background: #fffbeb;
  }
`;

/* ── User selector ──────────────────────────────────────────── */

export const UserSelectorRow = styled.div`
  background: #ffffff;
  border: 0.5px solid rgba(0, 0, 0, 0.1);
  border-radius: 12px;
  padding: 12px 16px;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
`;

export const UserSelectorLabel = styled.span`
  font-size: 13px;
  color: #374151;
  font-weight: 500;
  white-space: nowrap;
`;

export const UserSelect = styled.select`
  flex: 1;
  padding: 8px 10px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 13px;
  color: #111827;
  background: #f9fafb;
  cursor: pointer;
  outline: none;

  &:focus {
    border-color: #2563eb;
    background: #eff6ff;
  }
`;
