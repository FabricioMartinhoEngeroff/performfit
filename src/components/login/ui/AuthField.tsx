import type { ChangeEvent, ReactNode, Ref } from "react";
import type { IconType } from "react-icons";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import styled from "styled-components";

const Wrapper = styled.div`
  width: 100%;
  text-align: left;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 4px;
  font-weight: bold;
  color: #004080;
  font-size: 15px;
`;

const Box = styled.div<{ $hasError: boolean }>`
  display: flex;
  align-items: center;
  gap: 8px;
  border: 2px solid ${({ $hasError }) => ($hasError ? "#dc3545" : "#0066cc")};
  border-radius: 8px;
  padding: 10px 14px;
  background: #fff;

  input {
    flex: 1;
    min-width: 0;
    border: none;
    outline: none;
    font-size: 16px;
    background: transparent;
    color: #333;
  }

  svg {
    color: ${({ $hasError }) => ($hasError ? "#dc3545" : "#0066cc")};
    flex-shrink: 0;
  }

  &:focus-within {
    box-shadow: 0 0 5px rgba(0, 102, 204, 0.5);
  }
`;

// Anula o `button { width: 100% }` global do index.css, que espremia o input até largura zero.
const ToggleButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  margin: 0;
  width: auto;
  flex-shrink: 0;
  display: flex;
  color: #0066cc;

  &:hover {
    background: none;
  }
`;

const FieldError = styled.p`
  font-size: 13px;
  color: #dc3545;
  margin: 4px 0 0 4px;
`;

interface Props {
  id: string;
  name: string;
  label: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onBlur: (e: ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  icon: IconType;
  autoComplete: string;
  maxLength: number;
  inputMode?: "email" | "text";
  error?: string;
  inputRef?: Ref<HTMLInputElement>;
  /** Presente apenas em campos de senha. */
  passwordVisible?: boolean;
  onTogglePassword?: () => void;
  children?: ReactNode;
}

export function AuthField({
  id,
  name,
  label,
  value,
  onChange,
  onBlur,
  type = "text",
  icon: Icon,
  autoComplete,
  maxLength,
  inputMode,
  error,
  inputRef,
  passwordVisible,
  onTogglePassword,
}: Props) {
  const errorId = `${id}-error`;
  const isPassword = onTogglePassword !== undefined;

  return (
    <Wrapper>
      <Label htmlFor={id}>{label}</Label>
      <Box $hasError={!!error}>
        <Icon aria-hidden="true" />
        <input
          ref={inputRef}
          id={id}
          name={name}
          type={isPassword ? (passwordVisible ? "text" : "password") : type}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          autoComplete={autoComplete}
          maxLength={maxLength}
          inputMode={inputMode}
          aria-invalid={error ? "true" : undefined}
          aria-describedby={error ? errorId : undefined}
        />
        {isPassword && (
          <ToggleButton
            type="button"
            onClick={onTogglePassword}
            aria-label={passwordVisible ? "Ocultar senha" : "Mostrar senha"}
            aria-pressed={!!passwordVisible}
          >
            {passwordVisible ? <FaEyeSlash aria-hidden="true" /> : <FaEye aria-hidden="true" />}
          </ToggleButton>
        )}
      </Box>
      {error && <FieldError id={errorId}>{error}</FieldError>}
    </Wrapper>
  );
}
