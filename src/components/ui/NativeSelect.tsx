import styled from "styled-components";

type Option = { label: string; value: string };

interface NativeSelectProps {
  label?: string;
  variant?: "light" | "dark";
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  disabled?: boolean;
}

const FieldWrapper = styled.div`
  width: 100%;
`;

const StyledLabel = styled.label<{ $variant: "light" | "dark" }>`
  display: block;
  margin: 0 0 6px;
  font-weight: 700;
  color: ${({ $variant }) => ($variant === "dark" ? "#00c853" : "#004080")};
  font-size: 14px;
`;

const StyledSelect = styled.select<{ $variant: "light" | "dark" }>`
  width: 100%;
  min-height: 44px; /* alvo confortável no mobile */
  padding: 10px 12px;
  border: 1px solid ${({ $variant }) => ($variant === "dark" ? "#2a2a2a" : "#0066cc")};
  border-radius: 8px;
  background: ${({ $variant }) => ($variant === "dark" ? "#121212" : "#fff")};
  color: ${({ $variant }) => ($variant === "dark" ? "#f1f1f1" : "#111")};
  font-size: 16px; /* evita zoom no iOS */
  outline: none;

  &:focus {
    box-shadow: 0 0 0 3px
      ${({ $variant }) =>
        $variant === "dark" ? "rgba(0, 200, 83, 0.2)" : "rgba(0, 102, 204, 0.15)"};
  }
`;

export function NativeSelect({
  label,
  variant = "light",
  value,
  onChange,
  options,
  disabled,
}: NativeSelectProps) {
  return (
    <FieldWrapper>
      {label ? <StyledLabel $variant={variant}>{label}</StyledLabel> : null}
      <StyledSelect
        $variant={variant}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </StyledSelect>
    </FieldWrapper>
  );
}
